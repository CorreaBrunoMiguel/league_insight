-- CreateEnum
CREATE TYPE "DatasetType" AS ENUM ('HISTORICAL', 'CURRENT_SEASON');

-- CreateEnum
CREATE TYPE "DatasetStatus" AS ENUM ('PENDING', 'OK', 'FAILED');

-- CreateTable
CREATE TABLE "Dataset" (
    "id" SERIAL NOT NULL,
    "source" TEXT NOT NULL,
    "type" "DatasetType" NOT NULL,
    "status" "DatasetStatus" NOT NULL DEFAULT 'PENDING',
    "leagueId" INTEGER,
    "seasonId" INTEGER,
    "ingestedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Dataset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_leagueId_fkey" FOREIGN KEY ("leagueId") REFERENCES "League"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Dataset" ADD CONSTRAINT "Dataset_seasonId_fkey" FOREIGN KEY ("seasonId") REFERENCES "Season"("id") ON DELETE SET NULL ON UPDATE CASCADE;
