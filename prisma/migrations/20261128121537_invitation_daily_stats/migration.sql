-- CreateTable
CREATE TABLE "InvitationDailyStat" (
    "invitationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "opens" INTEGER NOT NULL DEFAULT 0,
    "guestOpens" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvitationDailyStat_pkey" PRIMARY KEY ("invitationId","date")
);

-- CreateIndex
CREATE INDEX "InvitationDailyStat_date_idx" ON "InvitationDailyStat"("date");

-- AddForeignKey
ALTER TABLE "InvitationDailyStat" ADD CONSTRAINT "InvitationDailyStat_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "Invitation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
