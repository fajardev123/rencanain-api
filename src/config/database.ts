import { Kysely, MysqlDialect } from "kysely";
import { createPool } from "mysql2";
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_PORT, DB_USER } from "./app";
import { DB } from "./types";

export const db = new Kysely<DB>({
  dialect: new MysqlDialect({
    pool: createPool({
      database: DB_DATABASE,
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASSWORD,
      port: DB_PORT,
    }),
  }),
});
