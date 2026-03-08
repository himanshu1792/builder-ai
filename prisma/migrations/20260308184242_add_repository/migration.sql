-- CreateTable
CREATE TABLE "Repository" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "repoUrl" TEXT NOT NULL,
    "pat" TEXT NOT NULL,
    "organization" TEXT,
    "outputFolder" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Repository_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Repository" ADD CONSTRAINT "Repository_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
