/*
  Warnings:

  - You are about to drop the column `assigneeId` on the `tasks` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "assigneeId";

-- CreateTable
CREATE TABLE "player_tasks" (
    "taskId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "player_tasks_pkey" PRIMARY KEY ("taskId","playerId")
);
