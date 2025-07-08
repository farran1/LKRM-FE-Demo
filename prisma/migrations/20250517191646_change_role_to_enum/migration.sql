/*
  Warnings:

  - You are about to drop the column `roleId` on the `users` table. All the data in the column will be lost.
  - Added the required column `role` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('COACH', 'ADMIN', 'TRAINEE');

-- DropIndex
DROP INDEX "users_roleId_idx";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "roleId",
ADD COLUMN     "role" "Role" NOT NULL,
ALTER COLUMN "profileId" DROP NOT NULL;
