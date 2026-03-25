export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public override readonly message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (resource: string) =>
  new AppError(404, `${resource} not found`, 'NOT_FOUND');

export const duplicate = (resource: string) =>
  new AppError(409, `${resource} already exists`, 'DUPLICATE_ENTRY');

export const badRequest = (message: string) =>
  new AppError(400, message, 'BAD_REQUEST');

export const rateLimited = () =>
  new AppError(429, 'Rate limit exceeded', 'RATE_LIMITED');
