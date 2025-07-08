-- CreateTable
CREATE TABLE "player_imports" (
    "id" SERIAL NOT NULL,
    "positionId" INTEGER NOT NULL,
    "avatar" TEXT,
    "name" TEXT NOT NULL,
    "jersey" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdBy" INTEGER NOT NULL,

    CONSTRAINT "player_imports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_imports_positionId_idx" ON "player_imports"("positionId");

-- CreateIndex
CREATE INDEX "player_imports_createdBy_idx" ON "player_imports"("createdBy");
