/*
  Warnings:

  - Added the required column `importId` to the `player_imports` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "player_imports" ADD COLUMN     "importId" TEXT NOT NULL;
