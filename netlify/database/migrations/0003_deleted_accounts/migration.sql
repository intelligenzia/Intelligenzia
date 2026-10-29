-- CreateTable
CREATE TABLE "DeletedAccount" (
    "id" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeletedAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DeletedAccount_emailHash_key" ON "DeletedAccount"("emailHash");

