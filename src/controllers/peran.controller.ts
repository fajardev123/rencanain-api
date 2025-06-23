import { FastifyInstance, FastifyRequest } from "fastify";
import { resourceReply } from "../utils";
import { db, Peran } from "../config";
import { sql } from "kysely";

export const peranController = (fastify: FastifyInstance) => {
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
        .selectFrom(["peran"])
        .select(["id", "kode", "nama", "detail", "created_at", "updated_at"]);
      let rawCountQuery = db
        .selectFrom("peran")
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

      const data = await rawQuery.orderBy("created_at", "desc").execute();
      const count = await rawCountQuery.executeTakeFirst();
      const total = Number(count?.total);

      resourceReply({
        reply: reply,
        message: "Data peran have been found",
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
        .selectFrom("peran")
        .select(["id", "kode", "nama", "detail", "created_at", "updated_at"]);

      const data = await rawQuery.where("id", "=", paramsId).executeTakeFirst();

      if (!data) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data peran not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data peran have been found",
        data: data,
      });
    }
  );

  fastify.post("/", async (request: FastifyRequest<{ Body: Peran }>, reply) => {
    const { kode, nama, detail } = request.body;
    const values = { kode, nama, detail };

    const newData = await db
      .insertInto("peran")
      .values(values)
      .executeTakeFirst();

    resourceReply({
      reply: reply,
      code: 201,
      message: "Data peran has been created",
      data: {
        id: Number(newData.insertId),
      },
    });
  });

  fastify.post(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: Peran }>,
      reply
    ) => {
      const paramsId = parseInt(request.params.id);
      const { kode, nama, detail } = request.body;
      const values = { kode, nama, detail, updated_at: new Date() };

      const updatedData = await db
        .updateTable("peran")
        .set(values)
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(updatedData.numUpdatedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data peran not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data peran has been updated",
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
        .deleteFrom("peran")
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(data.numDeletedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data peran not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data peran has been deleted",
      });
    }
  );
};
