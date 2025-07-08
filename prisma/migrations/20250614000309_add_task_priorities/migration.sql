/*
  Warnings:

  - You are about to drop the column `priority` on the `tasks` table. All the data in the column will be lost.
  - Added the required column `priorityId` to the `tasks` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "priority",
ADD COLUMN     "priorityId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "task_priorities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "weight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "task_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "task_priorities_weight_idx" ON "task_priorities"("weight");
