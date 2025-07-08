-- CreateEnum
CREATE TYPE "Status" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "status" "Status" NOT NULL DEFAULT 'TODO';
