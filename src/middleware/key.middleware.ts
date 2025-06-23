import { FastifyReply, FastifyRequest, HookHandlerDoneFunction } from "fastify";
import { SECRET_KEY } from "../config";

export function keyMiddleware(
  req: FastifyRequest,
  reply: FastifyReply,
  done: HookHandlerDoneFunction
) {
  const key = req.headers["x-lux-key"] as string | undefined;

  if (!key) {
    return reply.status(401).send({
      status: "error",
      code: 401,
      state: "keyRequired",
      message: "Lux key is required.",
    });
  }

  if (!SECRET_KEY || key !== SECRET_KEY) {
    return reply.status(401).send({
      status: "error",
      code: 401,
      state: "invalidKey",
      message: "Invalid Lux key.",
    });
  }

  done();
}
