import fastify from "fastify";
import { APP_HOST, APP_PORT, COOKIE_SECRET_KEY, pinoTransport } from "./config";
import { privateRoutes, publicRoutes } from "./routes";
import { resourceReply } from "./utils";
import fastifyCookie from "@fastify/cookie";
import fastifyCors from "@fastify/cors";

const app = fastify({
  loggerInstance: pinoTransport,
});

app.register(fastifyCors, { origin: true, credentials: true });
app.register(fastifyCookie, { secret: COOKIE_SECRET_KEY });
app.register(publicRoutes);
app.register(privateRoutes, { prefix: "api" });

app.setErrorHandler(async (err, request, reply) => {
  resourceReply({
    reply: reply,
    status: "error",
    code: 500,
    message: err.message,
    error: err.name,
  });
});

app.listen({ port: APP_PORT, host: APP_HOST }, (err) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
});
