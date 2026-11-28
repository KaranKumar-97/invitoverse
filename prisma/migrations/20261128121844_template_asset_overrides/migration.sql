-- CreateTable
CREATE TABLE "TemplateAssetOverride" (
    "templateSlug" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "provider" "MusicProvider" NOT NULL,
    "publicId" TEXT NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "licence" "MusicLicence" NOT NULL DEFAULT 'UNLICENSED',
    "updatedBy" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TemplateAssetOverride_pkey" PRIMARY KEY ("templateSlug","file")
);
