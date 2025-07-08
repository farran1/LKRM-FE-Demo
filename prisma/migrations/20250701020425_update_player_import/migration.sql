/*
  Warnings:

  - You are about to drop the column `avatar` on the `player_imports` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "player_imports" DROP COLUMN "avatar",
ADD COLUMN     "error" TEXT,
ALTER COLUMN "positionId" DROP NOT NULL,
ALTER COLUMN "name" DROP NOT NULL,
ALTER COLUMN "jersey" DROP NOT NULL,
ALTER COLUMN "phoneNumber" DROP NOT NULL,
ALTER COLUMN "weight" DROP NOT NULL,
ALTER COLUMN "height" DROP NOT NULL;
