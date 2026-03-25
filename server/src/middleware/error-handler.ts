import { type Request, type Response, type NextFunction, type ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

export const errorHandler: ErrorRequestHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  // Zod validation error
  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: 'Validation error',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        fields: err.flatten().fieldErrors,
      },
    });
    return;
  }

  // Known app error
  if (err instanceof AppError) {
    logger.error(`AppError [${err.statusCode}]: ${err.message}`);
    res.status(err.statusCode).json({
      error: {
        message: err.message,
        code: err.code ?? 'APP_ERROR',
        statusCode: err.statusCode,
      },
    });
    return;
  }

  // Prisma unique constraint
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      res.status(409).json({
        error: { message: 'Duplicate entry', code: 'DUPLICATE_ENTRY', statusCode: 409 },
      });
      return;
    }
    if (err.code === 'P2025') {
      res.status(404).json({
        error: { message: 'Record not found', code: 'NOT_FOUND', statusCode: 404 },
      });
      return;
    }
  }

  // Unknown error
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: {
      message: 'Internal server error',
      code: 'INTERNAL_ERROR',
      statusCode: 500,
    },
  });
};
