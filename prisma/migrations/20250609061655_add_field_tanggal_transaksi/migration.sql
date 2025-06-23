/*
  Warnings:

  - You are about to drop the column `tanggal` on the `transaksi` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `transaksi` DROP COLUMN `tanggal`,
    ADD COLUMN `tanggal_transaksi` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3);
