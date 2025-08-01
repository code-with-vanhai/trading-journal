-- CreateEnum
CREATE TYPE "FeeType" AS ENUM ('CUSTODY_FEE', 'ADVANCE_SELLING_FEE', 'ACCOUNT_MAINTENANCE', 'TRANSFER_FEE', 'DIVIDEND_TAX', 'INTEREST_FEE', 'DATA_FEED_FEE', 'SMS_NOTIFICATION_FEE', 'STATEMENT_FEE', 'WITHDRAWAL_FEE', 'OTHER_FEE');

-- CreateEnum
CREATE TYPE "AdjustmentType" AS ENUM ('CASH_DIVIDEND', 'STOCK_DIVIDEND', 'STOCK_SPLIT', 'REVERSE_SPLIT', 'MERGER', 'SPINOFF');

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_transactionId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntry" DROP CONSTRAINT "JournalEntry_userId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntryTag" DROP CONSTRAINT "JournalEntryTag_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "JournalEntryTag" DROP CONSTRAINT "JournalEntryTag_tagId_fkey";

-- DropForeignKey
ALTER TABLE "StockAccount" DROP CONSTRAINT "StockAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "Strategy" DROP CONSTRAINT "Strategy_userId_fkey";

-- DropForeignKey
ALTER TABLE "Tag" DROP CONSTRAINT "Tag_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_stockAccountId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_userId_fkey";

-- CreateTable
CREATE TABLE "PurchaseLot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockAccountId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "pricePerShare" DOUBLE PRECISION NOT NULL,
    "totalCost" DOUBLE PRECISION NOT NULL,
    "buyFee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "remainingQuantity" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PurchaseLot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountFee" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockAccountId" TEXT NOT NULL,
    "feeType" "FeeType" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "description" TEXT,
    "feeDate" TIMESTAMP(3) NOT NULL,
    "referenceNumber" TEXT,
    "attachmentUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountFee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CostBasisAdjustment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stockAccountId" TEXT NOT NULL,
    "ticker" TEXT NOT NULL,
    "adjustmentType" "AdjustmentType" NOT NULL,
    "eventDate" TIMESTAMP(3) NOT NULL,
    "dividendPerShare" DOUBLE PRECISION,
    "taxRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05,
    "splitRatio" DOUBLE PRECISION,
    "description" TEXT,
    "externalRef" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "processedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "CostBasisAdjustment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PurchaseLot_userId_ticker_stockAccountId_idx" ON "PurchaseLot"("userId", "ticker", "stockAccountId");

-- CreateIndex
CREATE INDEX "PurchaseLot_purchaseDate_idx" ON "PurchaseLot"("purchaseDate");

-- CreateIndex
CREATE INDEX "PurchaseLot_remainingQuantity_idx" ON "PurchaseLot"("remainingQuantity");

-- CreateIndex
CREATE INDEX "PurchaseLot_userId_stockAccountId_ticker_remainingQuantity_idx" ON "PurchaseLot"("userId", "stockAccountId", "ticker", "remainingQuantity");

-- CreateIndex
CREATE INDEX "PurchaseLot_userId_ticker_purchaseDate_idx" ON "PurchaseLot"("userId", "ticker", "purchaseDate");

-- CreateIndex
CREATE INDEX "AccountFee_userId_stockAccountId_idx" ON "AccountFee"("userId", "stockAccountId");

-- CreateIndex
CREATE INDEX "AccountFee_feeType_idx" ON "AccountFee"("feeType");

-- CreateIndex
CREATE INDEX "AccountFee_feeDate_idx" ON "AccountFee"("feeDate");

-- CreateIndex
CREATE INDEX "Transaction_userId_transactionDate_ticker_idx" ON "Transaction"("userId", "transactionDate", "ticker");

-- CreateIndex
CREATE INDEX "Transaction_userId_stockAccountId_ticker_idx" ON "Transaction"("userId", "stockAccountId", "ticker");

-- CreateIndex
CREATE INDEX "Transaction_type_userId_idx" ON "Transaction"("type", "userId");
