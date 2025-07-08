/*
  Warnings:

  - Changed the type of `weight` on the `players` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `height` on the `players` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "players" DROP COLUMN "weight",
ADD COLUMN     "weight" DOUBLE PRECISION NOT NULL,
DROP COLUMN "height",
ADD COLUMN     "height" DOUBLE PRECISION NOT NULL;
