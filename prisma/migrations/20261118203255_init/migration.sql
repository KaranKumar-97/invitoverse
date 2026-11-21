-- CreateEnum
CREATE TYPE "Role" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "TemplateCategory" AS ENUM ('ROYAL', 'MINIMAL', 'FLORAL', 'CINEMATIC', 'MODERN');

-- CreateEnum
CREATE TYPE "TemplateTier" AS ENUM ('FREE', 'PREMIUM');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventAccess" AS ENUM ('ALL', 'SELECTED');

-- CreateEnum
CREATE TYPE "GuestStatus" AS ENUM ('NOT_SHARED', 'SHARED', 'OPENED');

-- CreateEnum
CREATE TYPE "MediaKind" AS ENUM ('IMAGE', 'VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "MediaRole" AS ENUM ('COUPLE', 'FAMILY', 'GALLERY', 'BACKGROUND', 'VIDEO', 'MUSIC', 'OTHER');

-- CreateEnum
CREATE TYPE "MediaProvider" AS ENUM ('CLOUDINARY', 'S3');

-- CreateEnum
CREATE TYPE "EntitlementType" AS ENUM ('TEMPLATE', 'INVITATION_PUBLISH', 'FEATURE');

-- CreateEnum
CREATE TYPE "EntitlementSource" AS ENUM ('FREE_LAUNCH', 'ORDER', 'ADMIN_GRANT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" TIMESTAMP(3),
    "name" TEXT,
    "image" TEXT,
    "role" "Role" NOT NULL DEFAULT 'USER',
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "Template" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "category" "TemplateCategory" NOT NULL,
    "tags" TEXT[],
    "tier" "TemplateTier" NOT NULL DEFAULT 'FREE',
    "pricePaise" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isNew" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "version" INTEGER NOT NULL DEFAULT 1,
    "posterUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Template_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "templateSlug" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'DRAFT',
    "contentSchemaVersion" INTEGER NOT NULL DEFAULT 1,
    "draftContent" JSONB NOT NULL,
    "draftDesign" JSONB NOT NULL,
    "draftUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedTemplateSlug" TEXT,
    "publishedContent" JSONB,
    "publishedDesign" JSONB,
    "publishedVersion" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "unpublishedAt" TIMESTAMP(3),
    "archivedAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "disabledReason" TEXT,
    "weddingDate" DATE,
    "coverImageUrl" TEXT,
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guest" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "displayName" VARCHAR(80) NOT NULL,
    "greeting" VARCHAR(120),
    "personalNote" VARCHAR(500),
    "notes" VARCHAR(500),
    "phone" VARCHAR(20),
    "eventAccess" "EventAccess" NOT NULL DEFAULT 'ALL',
    "eventIds" TEXT[],
    "token" TEXT NOT NULL,
    "tokenCreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "GuestStatus" NOT NULL DEFAULT 'NOT_SHARED',
    "sharedAt" TIMESTAMP(3),
    "firstOpenedAt" TIMESTAMP(3),
    "lastOpenedAt" TIMESTAMP(3),
    "openCount" INTEGER NOT NULL DEFAULT 0,
    "rsvp" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevokedGuestToken" (
    "token" TEXT NOT NULL,
    "guestId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RevokedGuestToken_pkey" PRIMARY KEY ("token")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "invitationId" TEXT,
    "kind" "MediaKind" NOT NULL,
    "role" "MediaRole",
    "provider" "MediaProvider" NOT NULL DEFAULT 'CLOUDINARY',
    "publicId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "mimeType" TEXT,
    "bytes" INTEGER,
    "width" INTEGER,
    "height" INTEGER,
    "durationSec" DOUBLE PRECISION,
    "alt" VARCHAR(200),
    "focalX" DOUBLE PRECISION,
    "focalY" DOUBLE PRECISION,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entitlement" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "EntitlementType" NOT NULL,
    "templateSlug" TEXT,
    "invitationId" TEXT,
    "feature" TEXT,
    "source" "EntitlementSource" NOT NULL,
    "orderId" TEXT,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Entitlement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Template_slug_key" ON "Template"("slug");

-- CreateIndex
CREATE INDEX "Template_isActive_sortOrder_idx" ON "Template"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_slug_key" ON "Invitation"("slug");

-- CreateIndex
CREATE INDEX "Invitation_ownerId_status_updatedAt_idx" ON "Invitation"("ownerId", "status", "updatedAt" DESC);

-- CreateIndex
CREATE INDEX "Invitation_slug_status_idx" ON "Invitation"("slug", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Guest_token_key" ON "Guest"("token");

-- CreateIndex
CREATE INDEX "Guest_invitationId_createdAt_idx" ON "Guest"("invitationId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "RevokedGuestToken_guestId_idx" ON "RevokedGuestToken"("guestId");

-- CreateIndex
CREATE INDEX "MediaAsset_invitationId_idx" ON "MediaAsset"("invitationId");

-- CreateIndex
CREATE INDEX "MediaAsset_ownerId_idx" ON "MediaAsset"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaAsset_provider_publicId_key" ON "MediaAsset"("provider", "publicId");

-- CreateIndex
CREATE INDEX "Entitlement_userId_type_idx" ON "Entitlement"("userId", "type");

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_templateSlug_fkey" FOREIGN KEY ("templateSlug") REFERENCES "Template"("slug") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guest" ADD CONSTRAINT "Guest_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevokedGuestToken" ADD CONSTRAINT "RevokedGuestToken_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entitlement" ADD CONSTRAINT "Entitlement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
