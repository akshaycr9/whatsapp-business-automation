import { type Request, type Response } from 'express';

// Extend Express Request to include rawBody
declare global {
  namespace Express {
    interface Request {
      rawBody?: Buffer;
    }
  }
}

export const captureRawBody = (req: Request, _res: Response, buf: Buffer) => {
  req.rawBody = buf;
};
