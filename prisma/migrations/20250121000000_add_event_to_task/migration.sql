-- AlterTable
ALTER TABLE "tasks" ADD COLUMN "eventId" INTEGER;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE; 
 
 