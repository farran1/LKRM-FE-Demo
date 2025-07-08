/*
  Warnings:

  - Added the required column `eventTypeId` to the `events` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "events" ADD COLUMN     "eventTypeId" INTEGER NOT NULL,
ADD COLUMN     "oppositionTeam" TEXT;

-- CreateTable
CREATE TABLE "eventTypes" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "eventTypes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_eventTypeId_idx" ON "events"("eventTypeId");
