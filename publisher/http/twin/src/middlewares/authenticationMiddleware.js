"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requiresAuthentication = void 0;
const httpError_1 = require("../types/errors/httpError");
const http_status_codes_1 = require("http-status-codes");
/**
 * Handles authentication check
 * @param error
 * @param request
 * @param response
 * @param next
 */
const requiresAuthentication = (error, request, response, next) => {
    var _a;
    if (!((_a = request === null || request === void 0 ? void 0 : request.session) === null || _a === void 0 ? void 0 : _a.userId) && process.env.ENVIRONMENT !== 'development') {
        throw new httpError_1.HttpError(http_status_codes_1.StatusCodes.UNAUTHORIZED);
    }
    next();
};
exports.requiresAuthentication = requiresAuthentication;
