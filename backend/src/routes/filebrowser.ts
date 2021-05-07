import { Router } from 'express';
import {
    createDirectoryWithRetry,
    getFormattedDetails,
    getStats,
    Path,
    readDir,
    saveFileWithRetry,
} from '../utils/files';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import { DirectoryContent, DirectoryDto, FileDto, PathInfo } from '../types/dtos/fileDto';
import { UploadedFile } from 'express-fileupload';

const router = Router();

router.get('/directories/content', async (req, res) => {
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

router.get('/directories/info', async (req, res) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string') p = '/';
    const path = new Path(p);
    const stats = await getStats(path);
    if (!stats.isDirectory() || stats.isBlockDevice() || stats.isCharacterDevice() || stats.isSymbolicLink() || stats.isSocket())
        throw new HttpError(StatusCodes.BAD_REQUEST, 'Path is not a directory');

    return getFormattedDetails(path);
});

router.post('/directories', async (req, res) => {
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

router.get('/files/info', async (req, res) => {
    let p = req.query.path;
    if (!p || typeof p !== 'string')
        throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

    const path = new Path(p);
    return getFormattedDetails(path);
});

router.post('/files', async (req, res) => {
    const files = req.files.newFiles as UploadedFile[] | UploadedFile;
    const dto = req.body as FileDto;
    if (!dto.path) dto.path = '/';
    if (Array.isArray(files)) {
        const results = [] as PathInfo[];
        await Promise.all(files.map(async f => {
            const path = new Path(dto.path);
            path.appendPath(f.name);
            const result = await saveFileWithRetry(path, f);
            results.push(result)
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

export default router;