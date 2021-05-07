import { StatusCodes } from 'http-status-codes';

export abstract class ErrorWrapper<T extends number> extends Error {
    private readonly _status: number;
    private readonly _message: string;

    constructor(status: T, message?: string) {
        super(message);
        this._status = status;
        this._message = message;
    }

    public get status() {
        return this._status;
    }

    public get message() {
        return this._message;
    }

    public abstract getHttpStatus(): StatusCodes;
}