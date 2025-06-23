import dotenv from "dotenv";
dotenv.config();

export const NODE_ENV = process.env.NODE_ENV;

export const APP_PORT = Number(process.env.APP_PORT);
export const APP_HOST = process.env.APP_HOST;
export const SECRET_KEY = process.env.SECRET_KEY;
export const COOKIE_SECRET_KEY = process.env.COOKIE_SECRET_KEY;

export const DB_DATABASE = process.env.DB_DATABASE;
export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD;
export const DB_PORT = parseInt(process.env.DB_PORT as string);

export const JWT_ACCESS_TOKEN = process.env.JWT_ACCESS_TOKEN;
export const JWT_REFRESH_TOKEN = process.env.JWT_REFRESH_TOKEN;
