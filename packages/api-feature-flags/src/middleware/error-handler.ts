import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  // PostgreSQL error codes
  if ('code' in err) {
    const pgError = err as any;
    
    // Unique violation
    if (pgError.code === '23505') {
      return res.status(409).json({
        success: false,
        error: 'A resource with this key already exists',
      });
    }

    // Foreign key violation
    if (pgError.code === '23503') {
      return res.status(400).json({
        success: false,
        error: 'Invalid reference to related resource',
      });
    }

    // Invalid JSON
    if (pgError.code === '22P02') {
      return res.status(400).json({
        success: false,
        error: 'Invalid JSON format',
      });
    }
  }

  // Default error
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
  });
};
