/*
  Warnings:

  - Added the required column `stockAccountId` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "stockAccountId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "StockAccount" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brokerName" TEXT,
    "accountNumber" TEXT,
    "description" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StockAccount_userId_idx" ON "StockAccount"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "StockAccount_userId_name_key" ON "StockAccount"("userId", "name");

-- CreateIndex
CREATE INDEX "Transaction_stockAccountId_idx" ON "Transaction"("stockAccountId");

-- AddForeignKey
ALTER TABLE "StockAccount" ADD CONSTRAINT "StockAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_stockAccountId_fkey" FOREIGN KEY ("stockAccountId") REFERENCES "StockAccount"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
