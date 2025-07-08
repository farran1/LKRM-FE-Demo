/*
  Warnings:

  - You are about to drop the `PlayerGoal` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PlayerNote` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "PlayerGoal";

-- DropTable
DROP TABLE "PlayerNote";

-- CreateTable
CREATE TABLE "player_notes" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "player_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_goals" (
    "id" SERIAL NOT NULL,
    "playerId" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "player_goals_pkey" PRIMARY KEY ("id")
);
