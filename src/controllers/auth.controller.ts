import { FastifyInstance, FastifyRequest } from "fastify";
import {
  generateAccessToken,
  generateRefreshToken,
  resourceReply,
} from "../utils";
import { db, JWT_REFRESH_TOKEN, NODE_ENV, User } from "../config";
import bcrypt from "bcryptjs";
import { authenticate } from "../middleware";
import jwt from "jsonwebtoken";
import { UserPayload } from "../types/fastify";

export const authController = (fastify: FastifyInstance) => {
  fastify.post(
    "/register",
    async (request: FastifyRequest<{ Body: User }>, reply) => {
      const { nama, username, password, email, telepon } = request.body;

      if (!username || !password) {
        resourceReply({
          reply: reply,
          status: "error",
          code: 422,
          message: "Username or password is empty",
        });
        return;
      }

      const checkUsername = await db
        .selectFrom("user")
        .select(["id", "username"])
        .where("username", "=", username)
        .executeTakeFirst();

      if (checkUsername) {
        resourceReply({
          reply,
          status: "error",
          code: 422,
          message: "Username already used",
        });
        return;
      }

      const passwordHashed = await bcrypt.hash(password!, 10);
      const values = {
        nama,
        username,
        password: passwordHashed,
        email,
        telepon,
        id_peran: 2,
      };

      await db.insertInto("user").values(values).executeTakeFirst();

      resourceReply({
        reply: reply,
        status: "success",
        code: 200,
        message: "Register successfully",
      });
    }
  );

  fastify.post(
    "/login",
    async (
      request: FastifyRequest<{ Body: { username: string; password: string } }>,
      reply
    ) => {
      const { username, password } = request.body;

      if (!username || !password) {
        resourceReply({
          reply: reply,
          status: "error",
          code: 401,
          message: "Unauthorized",
        });
        return;
      }

      const checkUsername = await db
        .selectFrom("user")
        .select(["id", "username", "password"])
        .where("username", "=", username)
        .executeTakeFirst();

      if (!checkUsername) {
        resourceReply({
          reply: reply,
          status: "error",
          code: 401,
          message: "Username or password is wrong",
        });
        return;
      }

      const isPassword = await bcrypt.compare(
        password,
        checkUsername!.password!
      );

      if (!isPassword) {
        resourceReply({
          reply: reply,
          status: "error",
          code: 401,
          message: "Username or password is wrong",
        });
        return;
      }

      const user = await db
        .selectFrom("user as u")
        .leftJoin("peran as p", "u.id_peran", "p.id")
        .select([
          "u.id",
          "u.nama",
          "u.username",
          "u.email",
          "u.telepon",
          "u.id_peran",
          "p.nama as nama_peran",
          "p.kode as kode_peran",
        ])
        .where("username", "=", checkUsername!.username)
        .executeTakeFirst();

      const payload = {
        id: user?.id,
        nama: user?.nama,
        username: user?.username,
        email: user?.email,
        telepon: user?.telepon,
        peranId: user?.id_peran,
        peran: {
          id: user?.id_peran,
          kode: user?.kode_peran,
          nama: user?.nama_peran,
        },
      };

      const accessToken = generateAccessToken(payload);
      const refreshToken = generateRefreshToken(payload);

      reply.setCookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: NODE_ENV === "production",
        sameSite: "lax",
        path: "/auth/refresh",
        maxAge: 7 * 24 * 60 * 60,
      });

      resourceReply({
        reply: reply,
        status: "success",
        code: 200,
        message: "Login successfully",
        data: {
          accessToken: accessToken,
          refreshToken: refreshToken,
        },
      });
    }
  );

  fastify.post("/refresh", async (request, reply) => {
    const refreshToken = request.cookies.refreshToken;

    if (!refreshToken) {
      resourceReply({
        reply: reply,
        status: "error",
        code: 401,
        message: "Unauthorized",
      });
      return;
    }

    const payload = jwt.verify(refreshToken!, JWT_REFRESH_TOKEN!);
    const dataUser = payload as UserPayload;

    const user = {
      id: dataUser?.id,
      nama: dataUser?.nama,
      username: dataUser?.username,
      email: dataUser?.email,
      telepon: dataUser?.telepon,
      peranIds: dataUser?.peranId,
      peran: dataUser?.peran,
    };

    const newAccessToken = generateAccessToken(user);

    resourceReply({
      reply: reply,
      status: "success",
      code: 200,
      message: "Refresh token successfully",
      data: {
        accessToken: newAccessToken,
      },
    });
  });

  fastify.get(
    "/getInfo",
    { preHandler: authenticate },
    async (request, reply) => {
      const user = {
        id: request.user?.id,
        nama: request.user?.nama,
        username: request.user?.username,
        email: request.user?.email,
        telepon: request.user?.telepon,
        peranIds: request.user?.peranId,
        peran: request.user?.peran,
      };

      resourceReply({
        reply: reply,
        status: "success",
        code: 200,
        message: "User have been found",
        data: user,
      });
    }
  );

  fastify.post("/logout", async (request, reply) => {
    reply.clearCookie("refreshToken", { path: "/auth/refresh" });

    resourceReply({
      reply: reply,
      status: "success",
      code: 200,
      message: "Logout successfully",
    });
  });

  fastify.post(
    "/ubah-password",
    { preHandler: authenticate },
    async (request, reply) => {
      const { password_baru, password_lama } = request.body as {
        password_baru: string;
        password_lama: string;
      };

      if (request.user?.id && password_baru && password_baru.length > 5) {
        const checkUser = await db
          .selectFrom("user")
          .select(["id", "username", "password"])
          .where("id", "=", request.user?.id)
          .executeTakeFirst();

        const isValidPassword = await bcrypt.compare(
          password_lama,
          checkUser?.password!
        );

        if (!isValidPassword) {
          resourceReply({
            reply: reply,
            status: "error",
            code: 422,
            message: "Password lama salah",
          });
          return;
        }

        const hasedPasswordBaru = await bcrypt.hash(password_baru, 10);
        const values = { password: hasedPasswordBaru };

        await db
          .updateTable("user")
          .set(values)
          .where("id", "=", request.user?.id)
          .executeTakeFirst();

        resourceReply({
          reply: reply,
          status: "success",
          code: 200,
          message: "Password berhasil di ubah",
        });
      } else {
        resourceReply({
          reply: reply,
          status: "error",
          code: 422,
          message: "Password minimal 5 huruf",
        });
      }
    }
  );
};
