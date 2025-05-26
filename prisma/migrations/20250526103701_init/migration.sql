/*
  Warnings:

  - You are about to drop the column `stockAccountId` on the `Transaction` table. All the data in the column will be lost.
  - You are about to drop the `StockAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "StockAccount" DROP CONSTRAINT "StockAccount_userId_fkey";

-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_stockAccountId_fkey";

-- DropIndex
DROP INDEX "Transaction_stockAccountId_idx";

-- AlterTable
ALTER TABLE "Transaction" DROP COLUMN "stockAccountId";

-- DropTable
DROP TABLE "StockAccount";
