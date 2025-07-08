-- CreateEnum
CREATE TYPE "Location" AS ENUM ('HOME', 'AWAY');

-- CreateTable
CREATE TABLE "events" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isRepeat" BOOLEAN NOT NULL DEFAULT false,
    "occurence" INTEGER NOT NULL DEFAULT 0,
    "Location" "Location" NOT NULL,
    "venue" TEXT NOT NULL,
    "isNotice" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" INTEGER NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "events_name_idx" ON "events"("name");
