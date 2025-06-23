export type UserPayload = {
  id: number;
  nama: string;
  username: string;
  email: string;
  telepon: string;
  peranId: number;
  peran: {
    id: number;
    kode: string;
    nama: string;
  };
};

declare module "fastify" {
  interface FastifyRequest {
    user?: UserPayload;
  }
}
