import { FastifyInstance, FastifyRequest } from "fastify";
import { resourceReply } from "../utils";
import { db, Kategori } from "../config";
import { sql } from "kysely";

export const kategoriController = (fastify: FastifyInstance) => {
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
        .selectFrom(["kategori"])
        .select(["id", "nama", "created_at", "updated_at"]);
      let rawCountQuery = db
        .selectFrom("kategori")
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
        message: "Data kategori have been found",
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
        .selectFrom("kategori")
        .select(["id", "nama", "created_at", "updated_at"]);

      const data = await rawQuery.where("id", "=", paramsId).executeTakeFirst();

      if (!data) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data kategori not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data kategori have been found",
        data: data,
      });
    }
  );

  fastify.post(
    "/",
    async (request: FastifyRequest<{ Body: Kategori }>, reply) => {
      const { nama } = request.body;
      const values = { nama };

      const newData = await db
        .insertInto("kategori")
        .values(values)
        .executeTakeFirst();

      resourceReply({
        reply: reply,
        code: 201,
        message: "Data kategori has been created",
        data: {
          id: Number(newData.insertId),
        },
      });
    }
  );

  fastify.post(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Kategori }>,
      reply
    ) => {
      const paramsId = parseInt(request.params.id);
      const { nama } = request.body;
      const values = { nama, updated_at: new Date() };

      const updatedData = await db
        .updateTable("kategori")
        .set(values)
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(updatedData.numUpdatedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data kategori not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data kategori has been updated",
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
        .deleteFrom("kategori")
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(data.numDeletedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data kategori not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data kategori has been deleted",
      });
    }
  );
};
