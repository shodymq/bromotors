-- CreateTable
CREATE TABLE "CreditSetting" (
    "id" TEXT NOT NULL,
    "rate" DOUBLE PRECISION NOT NULL DEFAULT 22,
    "minDownPercent" DOUBLE PRECISION NOT NULL DEFAULT 20,
    "maxMonths" INTEGER NOT NULL DEFAULT 84,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CreditSetting_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Car" ADD COLUMN "isDiscount" BOOLEAN NOT NULL DEFAULT false;
