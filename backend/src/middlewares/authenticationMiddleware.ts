import express from 'express';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';

/**
 * Handles authentication check
 * @param error
 * @param request
 * @param response
 * @param next
 */

export const requiresAuthentication  = (
    error: Error,
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
): express.Response | void => {
    if (!request?.session?.userId && process.env.ENVIRONMENT !== 'development') {
        throw new HttpError(StatusCodes.UNAUTHORIZED)
    }

    next();
};
