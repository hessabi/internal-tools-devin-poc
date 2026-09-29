import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// Synthetic data only. Nothing here refers to a real person.
const prisma = new PrismaClient();

const users = [
  { email: "analyst.one@example.com", name: "Test Analyst 01", role: "analyst" },
  { email: "analyst.two@example.com", name: "Test Analyst 02", role: "analyst" },
  { email: "manager.one@example.com", name: "Test Manager 01", role: "manager" },
  { email: "admin.one@example.com", name: "Test Admin 01", role: "admin" },
] as const;

const countries = ["AQ", "BV", "CX", "EH", "UM"] as const;
const riskLevels = ["low", "medium", "high"] as const;
const statuses = ["pending", "in_review", "approved", "rejected"] as const;
const refundReasons = [
  "damaged_item",
  "not_received",
  "duplicate_charge",
  "service_issue",
  "other",
] as const;
const refundAmountsCents = [1250, 4999, 18000, 50000, 64000, 125000, 9900, 275000] as const;

async function main(): Promise<void> {
  await prisma.auditEntry.deleteMany();
  await prisma.refund.deleteMany();
  await prisma.kycCase.deleteMany();
  await prisma.user.deleteMany();

  const createdUsers = await Promise.all(
    users.map((user) => prisma.user.create({ data: user })),
  );
  const analysts = createdUsers.filter((user) => user.role === "analyst");
  const now = Date.now();

  for (let index = 0; index < 48; index += 1) {
    const number = index + 1;
    const status =
      number <= 24
        ? statuses[0]
        : number <= 34
          ? statuses[1]
          : number <= 42
            ? statuses[2]
            : statuses[3];
    const assigneeId =
      status === "in_review" ? analysts[(number - 25) % analysts.length].id : null;
    const submittedAt = new Date(
      now - (30 - (index % 30)) * 24 * 60 * 60 * 1000,
    );
    await prisma.kycCase.create({
      data: {
        customerLabel: `Test Customer ${String(number).padStart(3, "0")}`,
        customerEmail: `test.customer.${String(number).padStart(3, "0")}@example.com`,
        country: countries[index % countries.length],
        riskLevel: riskLevels[index % riskLevels.length],
        status,
        assigneeId,
        notes: "",
        submittedAt,
      },
    });
  }

  for (let index = 0; index < 40; index += 1) {
    const number = index + 1;
    const status = statuses[index % statuses.length];
    const assigneeId =
      status === "in_review" ? analysts[index % analysts.length].id : null;
    const label = String(number).padStart(3, "0");
    await prisma.refund.create({
      data: {
        refundLabel: `Refund RF-${label}`,
        customerLabel: `Test Customer ${label}`,
        orderReference: `test-order-${1000 + number}`,
        amountCents: refundAmountsCents[index % refundAmountsCents.length],
        currency: "USD",
        reason: refundReasons[index % refundReasons.length],
        status,
        assigneeId,
        submittedAt: new Date(now - (40 - index) * 6 * 60 * 60 * 1000),
      },
    });
  }
}

main()
  .catch((error: unknown) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
