import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<FastifyReply>();
    const request = context.getRequest<FastifyRequest>();
    const requestPath = request.url.split('?')[0];
    const status =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      const name = exception instanceof Error ? exception.name : 'UnknownError';
      this.logger.error(
        `[requestId=${request.id}] ${request.method} ${requestPath} failed with ${name}`,
      );
      response.status(status).send({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Error interno del servidor',
      });
      return;
    }

    if (status === HttpStatus.UNAUTHORIZED && requestPath === '/v1/auth/login') {
      this.logger.warn(`[requestId=${request.id}] login rejected`);
    }

    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : undefined;
    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse && typeof exceptionResponse === 'object' && 'message' in exceptionResponse
          ? (exceptionResponse as { message: string | string[] }).message
          : 'Solicitud inválida';

    const code =
      exceptionResponse && typeof exceptionResponse === 'object' && 'code' in exceptionResponse
        ? (exceptionResponse as { code?: unknown }).code
        : undefined;
    response.status(status).send({
      statusCode: status,
      message,
      ...(typeof code === 'string' ? { code } : {}),
    });
  }
}
