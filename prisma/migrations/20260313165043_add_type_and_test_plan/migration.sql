-- AlterTable
ALTER TABLE "Scenario" ADD COLUMN     "testPlan" TEXT,
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'smoke';
