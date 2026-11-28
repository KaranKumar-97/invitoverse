-- CreateEnum
CREATE TYPE "MusicProvider" AS ENUM ('STATIC', 'LOCAL', 'CLOUDINARY');

-- CreateEnum
CREATE TYPE "MusicLicence" AS ENUM ('OWNED', 'LICENSED', 'ROYALTY_FREE', 'UNLICENSED');

-- AlterTable
ALTER TABLE "Template" ADD COLUMN     "defaultTrackId" TEXT;

-- CreateTable
CREATE TABLE "MusicTrack" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "mood" TEXT NOT NULL DEFAULT '',
    "url" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL DEFAULT 'STATIC',
    "publicId" TEXT,
    "durationSec" INTEGER NOT NULL DEFAULT 0,
    "licence" "MusicLicence" NOT NULL DEFAULT 'UNLICENSED',
    "licenceNote" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "replacedBy" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MusicTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MusicTrack_isActive_sortOrder_idx" ON "MusicTrack"("isActive", "sortOrder");
