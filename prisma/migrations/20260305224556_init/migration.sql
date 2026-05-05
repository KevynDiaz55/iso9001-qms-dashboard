-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "industry" TEXT,
    "location" TEXT NOT NULL,
    "tmacCoach" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserCompany" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "roleInCompany" TEXT NOT NULL,
    CONSTRAINT "UserCompany_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "UserCompany_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DocumentLevel" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "IsoArea" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clauseCode" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "Requirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "isoAreaId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "defaultLevelId" INTEGER NOT NULL,
    CONSTRAINT "Requirement_isoAreaId_fkey" FOREIGN KEY ("isoAreaId") REFERENCES "IsoArea" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Requirement_defaultLevelId_fkey" FOREIGN KEY ("defaultLevelId") REFERENCES "DocumentLevel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyRequirement" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" TEXT NOT NULL,
    "requirementId" INTEGER NOT NULL,
    "levelId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "priority" TEXT NOT NULL,
    "dueDate" DATETIME,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    CONSTRAINT "CompanyRequirement_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyRequirement_requirementId_fkey" FOREIGN KEY ("requirementId") REFERENCES "Requirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyRequirement_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "DocumentLevel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CompanyRequirement_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Document" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyRequirementId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "levelId" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "cloudProvider" TEXT NOT NULL,
    "cloudUrl" TEXT NOT NULL,
    "version" TEXT,
    "createdById" TEXT NOT NULL,
    "approvedById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Document_companyRequirementId_fkey" FOREIGN KEY ("companyRequirementId") REFERENCES "CompanyRequirement" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Document_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES "DocumentLevel" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Document_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanySettings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" TEXT NOT NULL,
    "mainCloudProvider" TEXT NOT NULL,
    "mainCloudUrl" TEXT NOT NULL,
    "implementationStartDate" DATETIME,
    "targetCertificationDate" DATETIME,
    CONSTRAINT "CompanySettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "PlaybookStep" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT
);

-- CreateTable
CREATE TABLE "CompanyPlaybookTask" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" TEXT NOT NULL,
    "stepId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "isDone" BOOLEAN NOT NULL DEFAULT false,
    "lastUpdatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanyPlaybookTask_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyPlaybookTask_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "PlaybookStep" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Company_location_idx" ON "Company"("location");

-- CreateIndex
CREATE INDEX "UserCompany_companyId_idx" ON "UserCompany"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "UserCompany_userId_companyId_key" ON "UserCompany"("userId", "companyId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLevel_shortName_key" ON "DocumentLevel"("shortName");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentLevel_order_key" ON "DocumentLevel"("order");

-- CreateIndex
CREATE UNIQUE INDEX "IsoArea_clauseCode_key" ON "IsoArea"("clauseCode");

-- CreateIndex
CREATE INDEX "Requirement_isoAreaId_idx" ON "Requirement"("isoAreaId");

-- CreateIndex
CREATE INDEX "CompanyRequirement_companyId_idx" ON "CompanyRequirement"("companyId");

-- CreateIndex
CREATE INDEX "CompanyRequirement_requirementId_idx" ON "CompanyRequirement"("requirementId");

-- CreateIndex
CREATE INDEX "CompanyRequirement_status_idx" ON "CompanyRequirement"("status");

-- CreateIndex
CREATE INDEX "CompanyRequirement_levelId_idx" ON "CompanyRequirement"("levelId");

-- CreateIndex
CREATE INDEX "CompanyRequirement_ownerUserId_idx" ON "CompanyRequirement"("ownerUserId");

-- CreateIndex
CREATE INDEX "CompanyRequirement_lastUpdatedAt_idx" ON "CompanyRequirement"("lastUpdatedAt");

-- CreateIndex
CREATE INDEX "Document_companyRequirementId_idx" ON "Document"("companyRequirementId");

-- CreateIndex
CREATE INDEX "Document_levelId_idx" ON "Document"("levelId");

-- CreateIndex
CREATE INDEX "Document_status_idx" ON "Document"("status");

-- CreateIndex
CREATE INDEX "Document_cloudProvider_idx" ON "Document"("cloudProvider");

-- CreateIndex
CREATE INDEX "Document_createdAt_idx" ON "Document"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "CompanySettings_companyId_key" ON "CompanySettings"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybookStep_order_key" ON "PlaybookStep"("order");

-- CreateIndex
CREATE INDEX "CompanyPlaybookTask_companyId_idx" ON "CompanyPlaybookTask"("companyId");

-- CreateIndex
CREATE INDEX "CompanyPlaybookTask_stepId_idx" ON "CompanyPlaybookTask"("stepId");
