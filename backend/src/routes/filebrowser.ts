import express, { Router } from 'express';
import {
    createDirectoryWithRetry,
    getFormattedDetails,
    getStats,
    Path,
    readDir,
    removeFile, saveFile,
    saveFileWithRetry,
} from '../utils/files';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import { DirectoryContent, DirectoryDto, FileDto, PathInfo } from '../types/dtos/fileDto';
import { UploadedFile } from 'express-fileupload';
import { requiresAuthentication } from '../middlewares/authenticationMiddleware';
import { createJwtToken, verifyJwtToken } from '../service/jwtService';
import { isBlocked, Permission, Token, TokenData } from '../store/tokenStore';
import syncRequest from "sync-request";
import { config } from '../config/config';
import { uuidv4 } from '../common';

const router = Router();

interface FileToken extends TokenData {
    file: string;
}

router.get('/directories/content', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    console.log('here');
    let p = req.query.path;
    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(p);
    const stats = await getStats(path);
    console.log(stats);
    if (!stats.isDirectory() || stats.isBlockDevice() || stats.isCharacterDevice() || stats.isSymbolicLink() || stats.isSocket())
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');
    res.json(await readDir(path, { withFileTypes: true }));
});

router.get('/directories/info', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(p);
    const stats = await getStats(path);
    if (!stats.isDirectory() || stats.isBlockDevice() || stats.isCharacterDevice() || stats.isSymbolicLink() || stats.isSocket())
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');

    return getFormattedDetails(path);
});

router.post('/directories', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const dto = req.body as DirectoryDto;
    if (!dto.path) dto.path = '/';
    if (!dto.name) dto.name = 'New Folder';
    const path = new Path(dto.path);
    path.appendPath(dto.name);
    const result = await createDirectoryWithRetry(path);
    console.log(result);
    res.status(StatusCodes.CREATED);
    res.json({
        name: result.name,
        isDirectory: true,
        isFile: false,
    } as DirectoryContent);
});

router.get('/files/info', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string')
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(p);
    res.json({
        ...(await getFormattedDetails(path)),
        key: `${config.userid}.${uuidv4()}`,
        readToken: createJwtToken({
            file: p,
            permissions: [Permission.FileBrowserRead],
        } as FileToken, 5 * 60),
        writeToken: createJwtToken({
            file: p,
            permissions: [Permission.FileBrowserWrite],
        } as FileToken, 24 * 60 * 60),
    });
    res.status(StatusCodes.OK);
});

router.post('/files', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    const files = req.files.newFiles as UploadedFile[] | UploadedFile;
    const dto = req.body as FileDto;
    if (!dto.path) dto.path = '/';
    if (Array.isArray(files)) {
        const results = [] as PathInfo[];
        await Promise.all(files.map(async f => {
            const path = new Path(dto.path);
            path.appendPath(f.name);
            const result = await saveFileWithRetry(path, f);
            results.push(result);
        }));
        res.json(results);
        res.status(StatusCodes.CREATED);
        return;
    }

    const path = new Path(dto.path);
    path.appendPath((files as UploadedFile).name);
    const result = await saveFileWithRetry(path, files as UploadedFile);
    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.delete('/files', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    try {
        const pathClass = new Path(req.body.filepath);
        const result = await removeFile(pathClass);
        res.json(result);
        res.status(StatusCodes.CREATED);
    } catch (e) {
        console.log(e);
    }
});

router.get('/files', requiresAuthentication, async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string')
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(p);
    res.download(path.securedPath);
    res.status(StatusCodes.OK);

});

interface OnlyOfficeCallback {
    key: string;
    status: number;
    url?: string;
}

router.get('/internal/files', async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    let token = req.query.token;
    if (!token || typeof token !== 'string')
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No valid token provided');

    if (!p || typeof p !== 'string')
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    if(isBlocked(token))
        throw new HttpError(StatusCodes.FORBIDDEN, "Provided token is blocked")

    const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
    if(err)
        throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
    if(!payload || !payload.data || payload.data.permissions.indexOf(Permission.FileBrowserRead) === -1 || payload.data.file !== p)
        throw new HttpError(StatusCodes.UNAUTHORIZED, "No permission for reading file");

    const path = new Path(p);
    res.download(path.securedPath);
    res.status(StatusCodes.OK);
});

router.post('/internal/files', async (req: express.Request, res: express.Response) => {
    const body = req.body as OnlyOfficeCallback;
    const token = req.query.token;
    if (!token || typeof token !== 'string')
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No valid token provided');

    if(body.status !== 2 && body.status !== 6) {
        res.json({error: 0});
        return;
    }

    if(isBlocked(token))
        throw new HttpError(StatusCodes.FORBIDDEN, "Provided token is blocked")

    const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
    if(err)
        throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
    if(!payload || !payload.data || payload.data.permissions.indexOf(Permission.FileBrowserWrite) === -1)
        throw new HttpError(StatusCodes.UNAUTHORIZED, "No permission for reading file");

    if (!payload.data.file || !body.url)
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');
    const url = new URL(body.url);
    url.hostname = "onlyoffice-documentserver";
    url.protocol = "http:"
    const fileResponse = syncRequest("GET", url);
    const fileBuffer = <Buffer>fileResponse.body;
    await saveFile(new Path(payload.data.file), fileBuffer)
    res.json({error: 0});
    res.status(StatusCodes.OK);
});

export default router;