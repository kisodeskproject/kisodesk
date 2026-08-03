// src/types/fastify.ts
import { FastifyRequest as OriginalFastifyRequest } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    user?: {
      id: string;
      email: string;
      role: string;
      authTime: number;
    };
  }
}
