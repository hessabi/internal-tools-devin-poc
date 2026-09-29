import { prisma } from "@/lib/db";

export type FixtureUsers = {
  analystOne: { id: string; email: string; name: string; role: string };
  analystTwo: { id: string; email: string; name: string; role: string };
  manager: { id: string; email: string; name: string; role: string };
  admin: { id: string; email: string; name: string; role: string };
};

export async function resetDatabase(): Promise<void> {
  await prisma.$executeRaw`DELETE FROM "AuditEntry"`;
  await prisma.$executeRaw`DELETE FROM "KycCase"`;
  await prisma.$executeRaw`DELETE FROM "User"`;
}

export async function createUsers(): Promise<FixtureUsers> {
  const analystOne = await prisma.user.create({
    data: {
      email: "analyst.one@example.com",
      name: "Test Analyst 01",
      role: "analyst",
    },
  });
  const analystTwo = await prisma.user.create({
    data: {
      email: "analyst.two@example.com",
      name: "Test Analyst 02",
      role: "analyst",
    },
  });
  const manager = await prisma.user.create({
    data: {
      email: "manager.one@example.com",
      name: "Test Manager 01",
      role: "manager",
    },
  });
  const admin = await prisma.user.create({
    data: {
      email: "admin.one@example.com",
      name: "Test Admin 01",
      role: "admin",
    },
  });
  return { analystOne, analystTwo, manager, admin };
}

export async function createKycCase(input: {
  riskLevel?: string;
  status?: string;
  assigneeId?: string | null;
  customerLabel?: string;
}) {
  return prisma.kycCase.create({
    data: {
      customerLabel: input.customerLabel ?? "Test Customer 001",
      customerEmail: "test.customer.001@example.com",
      country: "AQ",
      riskLevel: input.riskLevel ?? "low",
      status: input.status ?? "pending",
      assigneeId: input.assigneeId ?? null,
      notes: "",
      submittedAt: new Date("2025-01-01T00:00:00.000Z"),
    },
  });
}

export async function countAuditEntries(entityId: string): Promise<number> {
  return prisma.auditEntry.count({ where: { entityId } });
}

export function sessionFor(user: {
  id: string;
  email: string;
  name: string;
  role: string;
}) {
  if (user.role !== "analyst" && user.role !== "manager" && user.role !== "admin") {
    throw new Error("Fixture user role is invalid");
  }
  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  } as const;
}
