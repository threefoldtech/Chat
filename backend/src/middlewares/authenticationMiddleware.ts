import express from 'express';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import {config} from "../config/config";

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
    if ( process.env.ENVIRONMENT !== 'development' && request?.session?.userId !== config.userid) {
        throw new HttpError(StatusCodes.UNAUTHORIZED)
    }

    next();
};
