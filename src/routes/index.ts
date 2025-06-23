import { FastifyInstance } from "fastify";
import {
  akunPembayaranController,
  authController,
  kategoriController,
  peranController,
  transaksiController,
  userController,
} from "../controllers";
import { authenticate, keyMiddleware } from "../middleware";

export const publicRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", keyMiddleware);
  fastify.get("/", (request, reply) => {
    reply.send({ message: "Backend Services of Rencanain Application" });
  });
  fastify.register(authController, { prefix: "auth" });
};

export const privateRoutes = async (fastify: FastifyInstance) => {
  fastify.addHook("preHandler", keyMiddleware);
  fastify.addHook("preHandler", authenticate);
  fastify.register(peranController, { prefix: "peran" });
  fastify.register(akunPembayaranController, { prefix: "akunPembayaran" });
  fastify.register(kategoriController, { prefix: "kategori" });
  fastify.register(transaksiController, { prefix: "transaksi" });
  fastify.register(userController, { prefix: "user" });
};
