import type { ColumnType } from "kysely";
export type Generated<T> = T extends ColumnType<infer S, infer I, infer U>
  ? ColumnType<S, I | undefined, U>
  : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type AkunPembayaran = {
    id: Generated<number>;
    kode: string | null;
    nama: string | null;
    created_at: Generated<Timestamp | null>;
    updated_at: Timestamp | null;
};
export type Kategori = {
    id: Generated<number>;
    kode: string | null;
    nama: string | null;
    created_at: Generated<Timestamp | null>;
    updated_at: Timestamp | null;
};
export type Peran = {
    id: Generated<number>;
    kode: string | null;
    nama: string | null;
    detail: string | null;
    created_at: Generated<Timestamp | null>;
    updated_at: Timestamp | null;
};
export type Transaksi = {
    id: Generated<number>;
    tanggal_transaksi: Generated<Timestamp | null>;
    nama: string | null;
    tipe: string | null;
    nominal: number | null;
    id_user: number | null;
    id_akun_pembayaran: number | null;
    id_kategori: number | null;
    created_at: Generated<Timestamp | null>;
    updated_at: Timestamp | null;
};
export type User = {
    id: Generated<number>;
    nama: string | null;
    username: string | null;
    password: string | null;
    email: string | null;
    telepon: string | null;
    id_peran: number | null;
    created_at: Generated<Timestamp | null>;
    updated_at: Timestamp | null;
};
export type DB = {
    akun_pembayaran: AkunPembayaran;
    kategori: Kategori;
    peran: Peran;
    transaksi: Transaksi;
    user: User;
};
