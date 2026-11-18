import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

export interface ErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  requestId?: string;
}

/** Uniform error shape for every failure. Unknown errors are logged and returned as a generic 500. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        const b = body as { message?: string | string[]; error?: string };
        message = b.message ?? exception.message;
        error = b.error ?? exception.name;
      }
      if (typeof body === 'string' || !(body as { error?: string }).error) {
        error = HttpStatus[statusCode]?.toString().replace(/_/g, ' ') ?? exception.name;
      }
    } else if (isBodyParserError(exception)) {
      statusCode = exception.status;
      error = 'Bad Request';
      message = exception.type === 'entity.too.large' ? 'Request body is too large.' : 'Request body must be valid JSON.';
    } else {
      this.logger.error(exception instanceof Error ? exception.stack : String(exception));
    }

    const requestId = req.headers['x-request-id'];
    const payload: ErrorBody = {
      statusCode,
      error,
      message,
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
      requestId: typeof requestId === 'string' ? requestId : undefined,
    };
    res.status(statusCode).json(payload);
  }
}

function isBodyParserError(e: unknown): e is { status: number; type: string } {
  return (
    typeof e === 'object' &&
    e !== null &&
    typeof (e as { status?: unknown }).status === 'number' &&
    typeof (e as { type?: unknown }).type === 'string'
  );
}
