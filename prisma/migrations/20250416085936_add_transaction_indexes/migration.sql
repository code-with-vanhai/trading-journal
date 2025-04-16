-- CreateIndex
CREATE INDEX "Transaction_userId_price_idx" ON "Transaction"("userId", "price");

-- CreateIndex
CREATE INDEX "Transaction_userId_type_transactionDate_idx" ON "Transaction"("userId", "type", "transactionDate");
