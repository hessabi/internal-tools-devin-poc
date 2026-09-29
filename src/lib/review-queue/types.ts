import type { Prisma } from "@prisma/client";
import type { ReactNode } from "react";
import type { AppErrorCode } from "@/lib/errors";
import type { AuditAction, ReviewStatus } from "@/lib/config/states";
import type { Role } from "@/lib/config/roles";
import type { Session } from "@/lib/auth/provider";

export type ReviewItem = {
  id: string;
  status: ReviewStatus;
  assigneeId: string | null;
};

export type Transition<Item extends ReviewItem> = {
  action: AuditAction;
  label: string;
  from: readonly ReviewStatus[];
  to: ReviewStatus;
  requireComment: boolean;
  allowedRoles: (
    item: Item,
    actor: Session,
  ) => readonly Role[] | "none";
  guard?: (item: Item, actor: Session) => AppErrorCode | null;
  onApply?: (item: Item, actor: Session) => Partial<Item>;
};

export type FilterDef = {
  key: string;
  label: string;
  options: readonly { value: string; label: string }[];
};

export type ColumnDef<Item> = {
  key: string;
  label: string;
  render: (item: Item) => ReactNode;
};

export type QueueRepository<Item extends ReviewItem> = {
  list(params: {
    filters: Record<string, string>;
    page: number;
    pageSize: number;
  }): Promise<{ items: Item[]; total: number }>;
  findById(id: string): Promise<Item | null>;
  update(
    tx: Prisma.TransactionClient,
    id: string,
    data: Partial<Item>,
  ): Promise<Item>;
};

export type ReviewQueueConfig<Item extends ReviewItem> = {
  key: string;
  title: string;
  description: string;
  basePath: string;
  entityType: string;
  transitions: readonly Transition<Item>[];
  filters: readonly FilterDef[];
  listColumns: readonly ColumnDef<Item>[];
  detailFields: readonly {
    key: string;
    label: string;
    render: (item: Item) => ReactNode;
  }[];
  editableNotesField?: keyof Item & string;
  repository: QueueRepository<Item>;
};
