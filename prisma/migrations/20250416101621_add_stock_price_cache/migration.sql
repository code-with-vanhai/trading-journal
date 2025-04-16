-- CreateTable
CREATE TABLE "StockPriceCache" (
    "id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'tcbs',
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StockPriceCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "StockPriceCache_symbol_key" ON "StockPriceCache"("symbol");

-- CreateIndex
CREATE INDEX "StockPriceCache_symbol_idx" ON "StockPriceCache"("symbol");

-- CreateIndex
CREATE INDEX "StockPriceCache_lastUpdatedAt_idx" ON "StockPriceCache"("lastUpdatedAt");
