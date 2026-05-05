-- AlterTable
ALTER TABLE "Company" ADD COLUMN "currentStage" TEXT;

-- CreateTable
CREATE TABLE "MeetingLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" TEXT NOT NULL,
    "meetingDate" DATETIME NOT NULL,
    "attendees" TEXT,
    "whatWasDone" TEXT NOT NULL,
    "planForNext" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MeetingLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "MeetingLog_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MeetingLog_companyId_idx" ON "MeetingLog"("companyId");
