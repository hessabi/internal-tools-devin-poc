import { PrismaClient } from "@prisma/client";
import { AppError } from "@/lib/errors";

export function createPrismaClient(): PrismaClient {
  return new PrismaClient().$extends({
    query: {
      auditEntry: {
        async update() {
          throw new AppError("AUDIT_IMMUTABLE", "Audit entries cannot be updated");
        },
        async updateMany() {
          throw new AppError("AUDIT_IMMUTABLE", "Audit entries cannot be updated");
        },
        async delete() {
          throw new AppError("AUDIT_IMMUTABLE", "Audit entries cannot be deleted");
        },
        async deleteMany() {
          throw new AppError("AUDIT_IMMUTABLE", "Audit entries cannot be deleted");
        },
        async upsert() {
          throw new AppError("AUDIT_IMMUTABLE", "Audit entries cannot be replaced");
        },
      },
    },
  }) as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
