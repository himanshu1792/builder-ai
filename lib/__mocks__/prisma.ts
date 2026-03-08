import { PrismaClient } from "../../generated/prisma/client";
import { beforeEach } from "vitest";
import { mockDeep, mockReset, DeepMockProxy } from "vitest-mock-extended";

const prisma = mockDeep<PrismaClient>();

beforeEach(() => {
  mockReset(prisma);
});

export { prisma };
export type MockPrismaClient = DeepMockProxy<PrismaClient>;
