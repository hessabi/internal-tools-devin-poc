import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { recordAudit } from "@/lib/audit/record";
import { AppError } from "@/lib/errors";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "@/lib/config/pagination";
import type { Session } from "@/lib/auth/provider";
import { requireRole } from "@/lib/auth/session";
import type {
  ReviewItem,
  ReviewQueueConfig,
  Transition,
  TransitionSummary,
} from "@/lib/review-queue/types";

type RawQuery = Record<string, string | string[] | undefined>;

function oneValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parseListQuery<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  rawQuery: RawQuery,
): { page: number; pageSize: number; filters: Record<string, string> } {
  const filterKeys = new Set(config.filters.map((filter) => filter.key));
  const allowedKeys = new Set(["page", "pageSize", ...filterKeys]);
  for (const key of Object.keys(rawQuery)) {
    if (!allowedKeys.has(key)) {
      throw new AppError("VALIDATION", `Unknown filter: ${key}`);
    }
  }
  const pageSchema = z.coerce.number().int().min(1).default(1);
  const pageSizeSchema = z.coerce.number().int().min(1).default(DEFAULT_PAGE_SIZE);
  const page = pageSchema.parse(oneValue(rawQuery.page));
  const requestedPageSize = pageSizeSchema.parse(oneValue(rawQuery.pageSize));
  const pageSize = Math.min(MAX_PAGE_SIZE, requestedPageSize);
  const filters: Record<string, string> = {};
  for (const filter of config.filters) {
    const value = oneValue(rawQuery[filter.key]);
    if (!value) {
      continue;
    }
    const option = filter.options.some((candidate) => candidate.value === value);
    if (!option) {
      throw new AppError("VALIDATION", `Invalid value for ${filter.label}`);
    }
    filters[filter.key] = value;
  }
  return { page, pageSize, filters };
}

function asRecord(value: object): Record<string, unknown> {
  return value as Record<string, unknown>;
}

function transitionFor<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  item: Item,
  actor: Session,
  action: string,
): Transition<Item> {
  const transition = config.transitions.find(
    (candidate) => candidate.action === action,
  );
  if (!transition || !transition.from.includes(item.status)) {
    throw new AppError("INVALID_TRANSITION", "That transition is not available");
  }
  const allowedRoles = transition.allowedRoles(item, actor);
  if (allowedRoles === "none" || !allowedRoles.includes(actor.role)) {
    throw new AppError("FORBIDDEN", "You do not have permission for this transition");
  }
  const guardCode = transition.guard?.(item, actor);
  if (guardCode) {
    throw new AppError(guardCode, "This transition is not allowed");
  }
  return transition;
}

export async function listItems<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  session: Session,
  rawQuery: RawQuery,
): Promise<{ items: Item[]; total: number; page: number; pageSize: number; pageCount: number }> {
  requireRole(session, config.readRoles);
  const query = parseListQuery(config, rawQuery);
  const result = await config.repository.list(query);
  return {
    ...result,
    page: query.page,
    pageSize: query.pageSize,
    pageCount: Math.max(1, Math.ceil(result.total / query.pageSize)),
  };
}

export async function getItem<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  session: Session,
  id: string,
): Promise<Item> {
  requireRole(session, config.readRoles);
  const parsed = z.string().min(1).safeParse(id);
  if (!parsed.success) {
    throw AppError.fromZod(parsed.error);
  }
  const item = await config.repository.findById(parsed.data);
  if (!item) {
    throw new AppError("NOT_FOUND", "Review item not found");
  }
  return item;
}

export function availableTransitions<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  item: Item,
  actor: Session,
): Transition<Item>[] {
  return config.transitions.filter((transition) => {
    if (!transition.from.includes(item.status)) {
      return false;
    }
    const roles = transition.allowedRoles(item, actor);
    if (roles === "none" || !roles.includes(actor.role)) {
      return false;
    }
    return !transition.guard || transition.guard(item, actor) === null;
  });
}

export function summarizeTransition<Item extends ReviewItem>(
  transition: Transition<Item>,
): TransitionSummary {
  return {
    action: transition.action,
    label: transition.label,
    requireComment: transition.requireComment,
  };
}

const transitionInput = z.object({
  id: z.string().min(1),
  action: z.string().min(1),
  comment: z.string().optional(),
});

export async function runTransition<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  session: Session,
  rawInput: unknown,
): Promise<Item> {
  const parsed = transitionInput.safeParse(rawInput);
  if (!parsed.success) {
    throw AppError.fromZod(parsed.error);
  }
  const item = await getItem(config, session, parsed.data.id);
  const transition = transitionFor(config, item, session, parsed.data.action);
  if (transition.requireComment && !parsed.data.comment?.trim()) {
    throw new AppError("COMMENT_REQUIRED", "A comment is required for this transition");
  }
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const changes = {
      status: transition.to,
      ...(transition.onApply?.(item, session) ?? {}),
    } as Partial<Item>;
    const updated = await config.repository.update(tx, item.id, changes);
    await recordAudit(tx, {
      actorId: session.userId,
      action: transition.action,
      entityType: config.entityType,
      entityId: item.id,
      before: asRecord(item),
      after: asRecord(updated),
      comment: parsed.data.comment,
    });
    return updated;
  });
}

const notesInput = z.object({
  id: z.string().min(1),
  notes: z.string().max(2000),
});

export async function updateNotes<Item extends ReviewItem>(
  config: ReviewQueueConfig<Item>,
  session: Session,
  rawInput: unknown,
): Promise<Item> {
  const parsed = notesInput.safeParse(rawInput);
  if (!parsed.success) {
    throw AppError.fromZod(parsed.error);
  }
  if (!config.editableNotesField) {
    throw new AppError("FORBIDDEN", "Notes are not editable for this queue");
  }
  const item = await getItem(config, session, parsed.data.id);
  return prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const updated = await config.repository.update(tx, item.id, {
      [config.editableNotesField as string]: parsed.data.notes,
    } as Partial<Item>);
    await recordAudit(tx, {
      actorId: session.userId,
      action: "update",
      entityType: config.entityType,
      entityId: item.id,
      before: asRecord(item),
      after: asRecord(updated),
    });
    return updated;
  });
}
