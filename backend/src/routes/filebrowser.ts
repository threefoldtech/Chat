import express, { Router } from 'express';
import {
    copyFile,
    createDirectoryWithRetry, doesPathExist, getFile, getFileStream,
    getFormattedDetails,
    getStats,
    isPathDirectory,
    Path,
    readDir,
    removeFile, saveFile,
    saveFileWithRetry,
    renameFile,
    copyFileWithRetry,
    copyDirectoryWithRetry,
    getFilesRecursive,
    filterOnString
} from '../utils/files';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import { DirectoryContent, DirectoryDto, FileDto, PathInfo } from '../types/dtos/fileDto';
import { UploadedFile } from 'express-fileupload';
import { createJwtToken, verifyJwtToken } from '../service/jwtService';
import { isBlocked, Permission, Token, TokenData } from '../store/tokenStore';
import syncRequest from 'sync-request';
import { config } from '../config/config';
import { uuidv4 } from '../common';
import * as fs from 'fs';

const AdmZip = require('adm-zip');

const router = Router();

interface FileToken extends TokenData {
    file: string;
}

router.get('/directories/content' , async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(p);
    const stats = await getStats(path);
    console.log(stats);
    if (!stats.isDirectory() || stats.isBlockDevice() || stats.isCharacterDevice() || stats.isSymbolicLink() || stats.isSocket())
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');
    res.json(await readDir(path, { withFileTypes: true }));
});

router.get('/directories/info' , async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(p);
    const stats = await getStats(path);
    if (!stats.isDirectory() || stats.isBlockDevice() || stats.isCharacterDevice() || stats.isSymbolicLink() || stats.isSocket())
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');

    return getFormattedDetails(path);
});

router.post('/directories' , async (req: express.Request, res: express.Response) => {
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

router.get('/files/info' , async (req: express.Request, res: express.Response) => {
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

router.post('/files' , async (req: express.Request, res: express.Response) => {
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

router.delete('/files' , async (req: express.Request, res: express.Response) => {
    const pathClass = new Path(req.body.filepath);
    const result = await removeFile(pathClass);
    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.get('/files' , async (req: express.Request, res: express.Response) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string')
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(p);
    if (await isPathDirectory(path)) {
        const zip = new AdmZip();
        let uploadDir = fs.readdirSync(path.securedPath);

        for (let i = 0; i < uploadDir.length; i++) {
            zip.addLocalFile(path.securedPath + '/' + uploadDir[i]);
        }
        const data = zip.toBuffer();

        // code to download zip file
        res.set('Content-Type', 'application/octet-stream');
        res.set('Content-Disposition', `attachment`);
        res.set('Content-Length', data.length);
        res.send(data);
    } else {
        res.download(path.securedPath);
        res.status(StatusCodes.CREATED);
    }
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

    if (isBlocked(token))
        throw new HttpError(StatusCodes.FORBIDDEN, 'Provided token is blocked');

    const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
    if (err)
        throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
    if (!payload || !payload.data || payload.data.permissions.indexOf(Permission.FileBrowserRead) === -1 || payload.data.file !== p)
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permission for reading file');

    const path = new Path(p);
    res.download(path.securedPath);
    res.status(StatusCodes.OK);
});

router.post('/internal/files', async (req: express.Request, res: express.Response) => {
    const body = req.body as OnlyOfficeCallback;
    const token = req.query.token;
    if (!token || typeof token !== 'string')
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No valid token provided');

    if (body.status !== 2 && body.status !== 6) {
        res.json({ error: 0 });
        return;
    }

    if (isBlocked(token))
        throw new HttpError(StatusCodes.FORBIDDEN, 'Provided token is blocked');

    const [payload, err] = verifyJwtToken<Token<FileToken>>(token);
    if (err)
        throw new HttpError(StatusCodes.UNAUTHORIZED, err.message);
    if (!payload || !payload.data || payload.data.permissions.indexOf(Permission.FileBrowserWrite) === -1)
        throw new HttpError(StatusCodes.UNAUTHORIZED, 'No permission for reading file');

    if (!payload.data.file || !body.url)
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');
    const url = new URL(body.url);
    url.hostname = 'onlyoffice-documentserver';
    url.protocol = 'http:';
    const fileResponse = syncRequest('GET', url);
    const fileBuffer = <Buffer>fileResponse.body;
    await saveFile(new Path(payload.data.file), fileBuffer);
    res.json({ error: 0 });
    res.status(StatusCodes.OK);
});

router.post('/files/copy', async (req, res) => {
    let data = req.body.paths;
    const result = await Promise.all(
        data.map(
            async function(item: { path: any; fullName: any; }) {
                console.log(item);
                const pathObj = new Path(item.path);
                const pathToPaste = new Path(req.body.pathToPaste + '/' + item.fullName);
                if (!await isPathDirectory(pathObj)) {
                    const file = await getFile(pathObj);
                    await copyFileWithRetry(pathToPaste, file);
                } else {
                    await copyDirectoryWithRetry(pathObj, pathToPaste);
                }
            }));
    res.json(result);
    res.status(StatusCodes.CREATED);

});
router.put('/files/rename', async (req, res) => {
    const oldPath = new Path(req.body.oldPath);
    const newPath = new Path(req.body.newPath);
    const result = await renameFile(oldPath, newPath);

    res.json(result);
    res.status(StatusCodes.CREATED);
});

router.get('/files/search' , async (req: express.Request, res: express.Response) => {
    let term = req.query.searchTerm;
    let dir = req.query.currentDir;
    if (!dir || typeof dir !== 'string')
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(dir);
    let fileList = await getFilesRecursive(path)
    let filteredList = await filterOnString(term.toString(), fileList)

   const results = filteredList.length > 0 ? filteredList : "None";
    res.json(results);
    res.status(StatusCodes.CREATED);
});

export default router;