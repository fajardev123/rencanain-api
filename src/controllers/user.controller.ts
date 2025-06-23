import { FastifyInstance, FastifyRequest } from "fastify";
import { resourceReply } from "../utils";
import { db, User } from "../config";
import { sql } from "kysely";
import bcrypt from "bcryptjs";

export const userController = (fastify: FastifyInstance) => {
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
        .selectFrom(["user as u"])
        .leftJoin("peran as p", "p.id", "u.id_peran")
        .select([
          "u.id",
          "u.nama",
          "u.username",
          "u.email",
          "u.telepon",
          "u.id_peran",
          "p.nama as nama_peran",
          "u.created_at",
          "u.updated_at",
        ]);
      let rawCountQuery = db
        .selectFrom("user as u")
        .select(sql<string>`COUNT(*)`.as("total"));

      if (filter.length > 0) {
        filter.map((o: any) => {
          rawQuery = rawQuery.where(o.handle, o.operator, o.value);
          rawCountQuery = rawCountQuery.where(o.handle, o.operator, o.value);
        });
      }

      if (search) {
        rawQuery = rawQuery.where((eb) =>
          eb.or([eb("u.nama", "like", `%${search}%`)])
        );

        rawCountQuery = rawCountQuery.where((eb) =>
          eb.or([eb("u.nama", "like", `%${search}%`)])
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
        message: "Data user have been found",
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
        .selectFrom("user")
        .select([
          "id",
          "nama",
          "username",
          "email",
          "telepon",
          "id_peran",
          "created_at",
          "updated_at",
        ]);

      const data = await rawQuery.where("id", "=", paramsId).executeTakeFirst();

      if (!data) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data user not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data user have been found",
        data: data,
      });
    }
  );

  fastify.post("/", async (request: FastifyRequest<{ Body: User }>, reply) => {
    const { nama, username, email, telepon } = request.body;

    if (username) {
      const checkUsername = await db
        .selectFrom("user")
        .select(["id", "username"])
        .where("username", "=", username)
        .executeTakeFirst();

      if (checkUsername) {
        resourceReply({
          reply: reply,
          status: "error",
          code: 422,
          message: "Username has been taken!",
        });
        return;
      }
    } else {
      resourceReply({
        reply: reply,
        status: "error",
        code: 422,
        message: "Username has been taken!",
      });
      return;
    }

    const defaultPassword = await bcrypt.hash("12345", 10);
    const values = {
      nama,
      username,
      email,
      telepon,
      password: defaultPassword,
      id_peran: 2,
    };

    const newData = await db
      .insertInto("user")
      .values(values)
      .executeTakeFirst();

    resourceReply({
      reply: reply,
      code: 201,
      message: "Data user has been created",
      data: {
        id: Number(newData.insertId),
      },
    });
  });

  fastify.post(
    "/:id",
    async (
      request: FastifyRequest<{ Params: { id: string }; Body: User }>,
      reply
    ) => {
      const paramsId = parseInt(request.params.id);
      const { nama, email, telepon, id_peran } = request.body;
      const values = {
        nama,
        email,
        telepon,
        id_peran,
        updated_at: new Date(),
      };

      const updatedData = await db
        .updateTable("user")
        .set(values)
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(updatedData.numUpdatedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data user not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data user has been updated",
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
        .deleteFrom("user")
        .where("id", "=", paramsId)
        .executeTakeFirst();

      if (Number(data.numDeletedRows) === 0) {
        return resourceReply({
          reply: reply,
          code: 404,
          status: "error",
          message: "Data user not found!!!",
        });
      }

      resourceReply({
        reply: reply,
        message: "Data user has been deleted",
      });
    }
  );
};
