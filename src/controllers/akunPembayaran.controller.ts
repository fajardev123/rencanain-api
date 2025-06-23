import { FastifyInstance, FastifyRequest } from "fastify";
import { resourceReply } from "../utils";
import { db, AkunPembayaran } from "../config";
import { sql } from "kysely";

export const akunPembayaranController = (fastify: FastifyInstance) => {
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
        .selectFrom(["akun_pembayaran"])
        .select(["id", "nama", "created_at", "updated_at"]);
      let rawCountQuery = db
        .selectFrom("akun_pembayaran")
        .select(sql<string>`COUNT(*)`.as("total"));

      if (filter.length > 0) {
        filter.map((o: any) => {
          rawQuery = rawQuery.where(o.handle, o.operator, o.value);
          rawCountQuery = rawCountQuery.where(o.handle, o.operator, o.value);
        });
      }

      if (search) {
        rawQuery = rawQuery.where((eb) =>
          eb.or([eb("nama", "like", `%${search}%`)])
        );

        rawCountQuery = rawCountQuery.where((eb) =>
          eb.or([eb("nama", "like", `%${search}%`)])
        );
      }

      if (limit) {
        const offset = page * limit - limit;
        rawQuery = rawQuery.limit(limit).offset(offset);
      }

      const data = await rawQuery.orderBy("created_at", "asc").execute();
      const count = await rawCountQuery.executeTakeFirst();
      const total = Number(count?.total);

      resourceReply({
        reply: reply,
        message: "Data akun pembayaran have been found",
        data: data,
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
        .selectFrom("akun_pembayaran")
        .select(["id", "nama", "created_at", "updated_at"]);

      const data = await rawQuery.where("id", "=", paramsId).executeTakeFirst();

      if (!data) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data akun pembayaran not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data akun pembayaran have been found",
        data: data,
      });
    }
  );

  fastify.post(
    "/",
    async (request: FastifyRequest<{ Body: AkunPembayaran }>, reply) => {
      const { nama } = request.body;
      const values = { nama };

      const newData = await db
        .insertInto("akun_pembayaran")
        .values(values)
        .executeTakeFirst();

      resourceReply({
        reply: reply,
        code: 201,
        message: "Data akun pembayaran has been created",
        data: {
          id: Number(newData.insertId),
        },
      });
    }
  );

  fastify.post(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: AkunPembayaran }>,
      reply
    ) => {
      const paramsId = parseInt(request.params.id);
      const { nama } = request.body;
      const values = { nama, updated_at: new Date() };

      const updatedData = await db
        .updateTable("akun_pembayaran")
        .set(values)
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(updatedData.numUpdatedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data akun pembayaran not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data akun pembayaran has been updated",
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
        .deleteFrom("akun_pembayaran")
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(data.numDeletedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data akun pembayaran not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data akun pembayaran has been deleted",
      });
    }
  );
};
