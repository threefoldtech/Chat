import { Router } from 'express';
import {
    copyFile,
    createDirectoryWithRetry, doesPathExist, getFile, getFileStream,
    getFormattedDetails,
    getStats, isPathDirectory,
    Path,
    readDir, removeFile,
    saveFileWithRetry,
    renameFile,
    copyFileWithRetry,
    copyDirectoryWithRetry
} from '../utils/files';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';
import { DirectoryContent, DirectoryDto, FileDto, PathInfo } from '../types/dtos/fileDto';
import { UploadedFile } from 'express-fileupload';
import * as fs from 'fs';
const AdmZip = require('adm-zip');

const router = Router();

router.get('/directories/content', async (req, res) => {
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
    console.log(files);
    console.log(dto);
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
router.delete('/files', async (req, res) => {
    try {
        const pathClass = new Path(req.body.filepath)
        const result = await removeFile(pathClass)
        res.json(result);
        res.status(StatusCodes.CREATED);
    } catch (e) {
        console.log(e);
    }
});

router.get('/files', async (req, res) => {
    try {
        let p = req.query.path
        if (!p || typeof p !== 'string')
            throw new HttpError(StatusCodes.BAD_REQUEST, 'File not found');

        const path = new Path(p);
        if(await isPathDirectory(path)){
            const zip = new AdmZip();
            let uploadDir = fs.readdirSync(path.securedPath);

            for(let i = 0; i < uploadDir.length;i++){
                zip.addLocalFile(path.securedPath+ "/"+uploadDir[i]);
            }
            const data = zip.toBuffer();

            // code to download zip file
            res.set('Content-Type','application/octet-stream');
            res.set('Content-Disposition',`attachment`);
            res.set('Content-Length',data.length);
            res.send(data);
        }else{
            res.download(path.securedPath);
            res.status(StatusCodes.CREATED);
        }



    } catch (e) {
        console.log(e);
    }
});

router.post('/pasteFiles', async (req, res) => {
    try {
        const path = new Path(req.body.data.filepath);
        let result: PathInfo;
        const pathToPaste = new Path(req.body.data.currentDir + "/" + req.body.data.name);
        if(!await isPathDirectory(path)) {
            const file = await getFile(path)
            result = await copyFileWithRetry(pathToPaste, file)
        }else
        {
            result = await copyDirectoryWithRetry(path, pathToPaste)
        }
        res.json(result);
        res.status(StatusCodes.CREATED);
    } catch (e) {
        console.log(e);
    }
});
router.post('/renameFiles', async (req, res) => {
    try {
        const oldPath = new Path(req.body.data.oldPath);
        const newPath = new Path(req.body.data.newPath);
        const result = await renameFile(oldPath, newPath)

        res.json(result);
        res.status(StatusCodes.CREATED);
    } catch (e) {
        console.log(e);
    }
});


export default router;