import jwt from "jsonwebtoken";
import { JWT_ACCESS_TOKEN } from "../config";
import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { resourceReply } from "../utils";
import { UserPayload } from "../types/fastify";

export function authenticate(
  request: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  try {
    const rawToken = request.headers.authorization;

    if (!rawToken) {
      resourceReply({
        reply: reply,
        status: "error",
        code: 401,
        message: "Unauthorized",
      });
      return;
    }

    const arrToken = rawToken?.split(" ");

    if (arrToken[0] != "Bearer" || !arrToken[1]) {
      resourceReply({
        reply: reply,
        status: "error",
        code: 401,
        message: "Unauthorized",
      });
      return;
    }

    const user = jwt.verify(arrToken[1], JWT_ACCESS_TOKEN!);
    request.user = user as UserPayload;

    done();
  } catch (error) {
    resourceReply({
      reply: reply,
      status: "error",
      code: 401,
      message: "Unauthorized",
      error,
    });
  }
}
