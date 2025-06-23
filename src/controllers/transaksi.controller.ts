import { FastifyInstance, FastifyRequest } from "fastify";
import { formatDate, resourceReply, toFormatIDR } from "../utils";
import { db, Transaksi } from "../config";
import { sql } from "kysely";
import _ from "lodash";
import dayjs from "dayjs";

export const transaksiController = (fastify: FastifyInstance) => {
  fastify.get(
    "/",
    async (
      request: FastifyRequest<{
        Querystring: {
          limit: string;
          page: string;
          search: string;
          filter: string;
        };
      }>,
      reply
    ) => {
      const limit = parseInt(request.query.limit as string);
      const page = parseInt(request.query.page as string);
      const search = request.query.search;
      const filter = request.query.filter
        ? JSON.parse(request.query.filter as string)
        : [];

      let rawQuery = db
        .selectFrom(["transaksi as t"])
        .leftJoin("akun_pembayaran as ap", "ap.id", "t.id_akun_pembayaran")
        .leftJoin("kategori as k", "k.id", "t.id_kategori")
        .leftJoin("user as u", "u.id", "t.id_user")
        .select([
          "t.id",
          "t.nama",
          "t.nominal",
          "t.tanggal_transaksi",
          "t.tipe",
          "t.id_akun_pembayaran",
          "ap.nama as nama_akun_pembayaran",
          "t.id_user",
          "u.nama as nama_user",
          "t.id_kategori",
          "k.nama as nama_kategori",
          "t.created_at",
          "t.updated_at",
        ]);

      let rawCountQuery = db
        .selectFrom("transaksi as t")
        .select(sql<string>`COUNT(*)`.as("total"));

      if (request.user?.id) {
        rawQuery = rawQuery.where("t.id_user", "=", request.user?.id);
        rawCountQuery = rawCountQuery.where("t.id_user", "=", request.user?.id);
      }

      if (filter.length > 0) {
        filter.map((o: any) => {
          if (o.value) {
            if (o.handle == "started_at") {
              const dateFilter = o.value;
              const firstDate = dayjs(dateFilter[0]).format("YYYY-MM-DD");
              let lastDate = firstDate;
              if (dateFilter[1]) {
                lastDate = dayjs(dateFilter[1]).format("YYYY-MM-DD");
              } else {
                lastDate = firstDate;
              }
              rawQuery = rawQuery.where((eb) =>
                eb.between(
                  "t.tanggal_transaksi",
                  new Date(firstDate),
                  new Date(lastDate)
                )
              );
              rawCountQuery = rawCountQuery.where((eb) =>
                eb.between(
                  "t.tanggal_transaksi",
                  new Date(firstDate),
                  new Date(lastDate)
                )
              );
            } else {
              rawQuery = rawQuery.where(o.handle, o.operator, o.value);
              rawCountQuery = rawCountQuery.where(
                o.handle,
                o.operator,
                o.value
              );
            }
          }
        });
      }

      if (search) {
        rawQuery = rawQuery.where((eb) =>
          eb.or([eb("t.nama", "like", `%${search}%`)])
        );

        rawCountQuery = rawCountQuery.where((eb) =>
          eb.or([eb("t.nama", "like", `%${search}%`)])
        );
      }

      if (limit) {
        const offset = page * limit - limit;
        rawQuery = rawQuery.limit(limit).offset(offset);
      }

      const data = await rawQuery.orderBy("created_at", "desc").execute();
      const count = await rawCountQuery.executeTakeFirst();
      const total = Number(count?.total);

      resourceReply({
        reply: reply,
        message: "Data transaksi have been found",
        data: data.map((field: any) => {
          return {
            ...field,
            display_nominal: toFormatIDR(field.nominal),
            display_tanggal_transaksi: formatDate(field.tanggal_transaksi),
            display_tipe: _.capitalize(field.tipe),
            display: `${_.capitalize(field.tipe)} ${
              field.nama_akun_pembayaran
            } - ${field?.nama}`,
          };
        }),
        meta: {
          limit: limit,
          page: page,
          total: total,
        },
      });
    }
  );

  fastify.get(
    "/:id",
    async (
      request: FastifyRequest<{
        Params: { id: string };
      }>,
      reply
    ) => {
      const paramsId = parseInt(request.params.id);

      let rawQuery = db
        .selectFrom("transaksi as t")
        .leftJoin("akun_pembayaran as ap", "ap.id", "t.id_akun_pembayaran")
        .leftJoin("kategori as k", "k.id", "t.id_kategori")
        .leftJoin("user as u", "u.id", "t.id_user")
        .select([
          "t.id",
          "t.nama",
          "t.nominal",
          "t.tanggal_transaksi",
          "t.tipe",
          "t.id_akun_pembayaran",
          "ap.nama as nama_akun_pembayaran",
          "t.id_user",
          "u.nama as nama_user",
          "t.id_kategori",
          "k.nama as nama_kategori",
          "t.created_at",
          "t.updated_at",
        ]);

      const data = await rawQuery
        .where("t.id", "=", paramsId)
        .executeTakeFirst();

      if (!data) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data transaksi not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data transaksi have been found",
        data: data,
      });
    }
  );

  fastify.post(
    "/",
    async (request: FastifyRequest<{ Body: Transaksi }>, reply) => {
      const {
        tanggal_transaksi,
        nama,
        nominal,
        tipe,
        id_akun_pembayaran,
        id_kategori,
        id_akun_pembayaran_asal,
      } = request.body as any;
      const values = {
        tanggal_transaksi: formatDate(tanggal_transaksi),
        nama,
        nominal,
        tipe,
        id_akun_pembayaran,
        id_kategori,
        id_user: request.user?.id,
      };

      if (id_akun_pembayaran_asal) {
        const asalValues = {
          tanggal_transaksi: formatDate(tanggal_transaksi),
          nama,
          nominal,
          tipe: tipe == "keluar" ? "masuk" : "keluar",
          id_akun_pembayaran: id_akun_pembayaran_asal,
          id_kategori,
          id_user: request.user?.id,
        };

        await db.insertInto("transaksi").values(asalValues).executeTakeFirst();
      }

      const newData = await db
        .insertInto("transaksi")
        .values(values)
        .executeTakeFirst();

      resourceReply({
        reply: reply,
        code: 201,
        message: "Data transaksi has been created",
        data: {
          id: Number(newData.insertId),
        },
      });
    }
  );

  fastify.post(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Transaksi }>,
      reply
    ) => {
      const paramsId = parseInt(request.params.id);
      const {
        tanggal_transaksi,
        nama,
        nominal,
        tipe,
        id_akun_pembayaran,
        id_kategori,
        id_user,
      } = request.body as any;
      const values = {
        tanggal_transaksi: formatDate(tanggal_transaksi),
        nama,
        nominal,
        tipe,
        id_akun_pembayaran,
        id_kategori,
        id_user,
        updated_at: new Date(),
      };

      const updatedData = await db
        .updateTable("transaksi")
        .set(values)
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(updatedData.numUpdatedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data transaksi not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data transaksi has been updated",
        data: {
          id: paramsId,
        },
      });
    }
  );

  fastify.delete(
    "/:id",
    async (request: FastifyRequest<{ Params: { id: string } }>, reply) => {
      const paramsId = parseInt(request.params.id);

      const data = await db
        .deleteFrom("transaksi")
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(data.numDeletedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data transaksi not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data transaksi has been deleted",
      });
    }
  );
};
