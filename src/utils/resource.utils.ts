import { FastifyReply } from "fastify";

interface IResourceMain {
  message: string;
  data?: any;
  code?: number;
  status?: string;
  error?: any;
}

interface IConfigResrouceReply extends IResourceMain {
  reply: FastifyReply;
  meta?: {
    limit: number;
    page: number;
    total: number;
  };
}

interface IResourceResult extends IResourceMain {
  meta?: {
    limit: number;
    page: number;
    pages: number;
    total: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const resourceReply = (config: IConfigResrouceReply) => {
  const result: IResourceResult = {
    status: config.status ?? "success",
    code: config.code ?? 200,
    message: config.message,
  };

  if (config.meta) {
    const pages = Math.ceil(config?.meta?.total / config?.meta?.limit);

    result["meta"] = {
      limit: config?.meta?.limit,
      page: config?.meta?.page,
      pages: !isNaN(pages) ? pages : 0,
      total: config?.meta?.total,
      hasNext: pages > config?.meta?.page,
      hasPrev: config?.meta?.page > 1,
    };
  }

  if (config.error) {
    result["error"] = config.error;
  }

  if (config.data) {
    result["data"] = config.data ?? null;
  }

  config.reply?.code(config.code ?? 200).send(result);
};
