/*
  Warnings:

  - You are about to drop the column `positionId` on the `player_imports` table. All the data in the column will be lost.
  - Added the required column `position` to the `player_imports` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "player_imports_positionId_idx";

-- AlterTable
ALTER TABLE "player_imports" DROP COLUMN "positionId",
ADD COLUMN     "position" TEXT NOT NULL;
