/**
 * Handles all the http Errors thrown by the server
 * @param error
 * @param request
 * @param response
 * @param next
 */
import express from 'express';
import { ErrorWrapper } from '../types/errors/errorWrapper';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export const errorMiddleware = (
    error: Error,
    request: express.Request,
    response: express.Response,
    next: express.NextFunction
): express.Response | void => {
    console.log(error);
    if (error instanceof ErrorWrapper) {
        return response
            .status(error.getHttpStatus())
            .send({ reason: getReasonPhrase(error.getHttpStatus()), message: error.message });
    }
    return response
        .status(StatusCodes.INTERNAL_SERVER_ERROR)
        .send({ message: error.message });
};
