-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('IMAGE', 'VIDEO');

-- CreateEnum
CREATE TYPE "SponsorTier" AS ENUM ('PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'PARTNER');

-- CreateTable
CREATE TABLE "Sponsor" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "websiteUrl" TEXT,
    "logoUrl" TEXT,
    "tier" "SponsorTier" NOT NULL DEFAULT 'PARTNER',
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sponsor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SponsorMedia" (
    "id" SERIAL NOT NULL,
    "sponsorId" INTEGER NOT NULL,
    "mediaType" "MediaType" NOT NULL,
    "mediaUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "title" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorMedia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sponsor_displayOrder_idx" ON "Sponsor"("displayOrder");

-- CreateIndex
CREATE INDEX "Sponsor_isActive_idx" ON "Sponsor"("isActive");

-- CreateIndex
CREATE INDEX "SponsorMedia_sponsorId_idx" ON "SponsorMedia"("sponsorId");

-- CreateIndex
CREATE INDEX "SponsorMedia_displayOrder_idx" ON "SponsorMedia"("displayOrder");

-- AddForeignKey
ALTER TABLE "SponsorMedia" ADD CONSTRAINT "SponsorMedia_sponsorId_fkey" FOREIGN KEY ("sponsorId") REFERENCES "Sponsor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
