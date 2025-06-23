/*
  Warnings:

  - You are about to drop the column `harga` on the `transaksi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transaksi` DROP COLUMN `harga`,
    ADD COLUMN `nominal` INTEGER NULL;
