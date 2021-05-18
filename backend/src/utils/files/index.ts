import PATH, { ParsedPath } from 'path';

import { BaseEncodingOptions, Dirent, promises as FS, Stats, lstatSync, rmdirSync } from 'fs';
import { FileSystemError, FileSystemErrorType as ErrorType } from '../../types/errors/fileSystemError';
import { DirectoryContent, DirectoryDto, PathInfo, FileInformation } from '../../types/dtos/fileDto';
import { ReadableStreamBuffer } from 'stream-buffers';
import { config } from '../../config/config';
import mimeType from 'mime';
import { UploadedFile } from 'express-fileupload';
import * as fse from 'fs-extra';

export class Path {
    private _path: string;
    private _securedPath: string;

    constructor(path: string) {
        this._path = path;
        this.setSecuredPath();
    }

    public setSecuredPath() {
        const baseDir = config.storage;
        const realPath = PATH.join(baseDir, this._path);
        if (realPath.indexOf(baseDir) !== 0)
            throw new FileSystemError(ErrorType.ForbidTraversal, 'Traversal not allowed!');

        this._securedPath = realPath;
    }

    public setPath(path: string) {
        this._path = path;
        this.setSecuredPath();
    }

    public appendPath(path: string) {
        this._path = PATH.join(this._path, path);
        this.setSecuredPath();
    }

    public get path() {
        return this._path;
    }

    public get securedPath() {
        return this._securedPath;
    }
}

/**
 * Get the stats of the selected path
 * @param path
 */
export const getStats = async (path: Path): Promise<Stats> => {
    const exists = await doesPathExist(path);
    if (!exists) {
        throw new FileSystemError(ErrorType.FileNotFound, 'fileDoesNotExist');
    }

    return FS.stat(path.securedPath);
};

/**
 * Get the details of the selected path
 * @param path
 */
export const getDetails = async (path: Path): Promise<ParsedPath> => {
    const exists = await doesPathExist(path);
    if (!exists) {
        throw new FileSystemError(ErrorType.PathDoesNotExist, 'fileDoesNotExist');
    }
    return PATH.parse(path.securedPath);
};

/**
 * Get the file content if exist
 * @param path
 */
export const getFile = async (
    path: Path,
): Promise<Buffer> => {
    const exists = await doesPathExist(path);
    if (!exists) {
        throw new FileSystemError(ErrorType.FileNotFound, 'fileDoesNotExist');
    }
    return await readFile(path);
};

/**
 * Get the formatted details of the path
 * @param path
 */
export const getFormattedDetails = async (
    path: Path,
): Promise<PathInfo> => {
    const stats = await getStats(path);
    const details = PATH.parse(path.securedPath);
    const extension = details.ext.replace('.', '');
    // console.log('Stats', stats);
    // console.log('Details', details);
    return {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        directory: path.path,
        fullName: details.base,
        name: details.name,
        extension: extension,
        size: stats.size,
        createdOn: stats.ctime,
        lastModified: stats.mtime,
        lastAccessed: stats.atime,
    };
};


/**
 * Create new directory, if it exist it will retry with a number suffix
 * @param path
 * @param count
 */
export const createDirectoryWithRetry = async (path: Path, count = 0): Promise<PathInfo> => {
    const result = await createDir(count === 0 ? path : new Path(`${path.path} (${count})`));
    if (!result) {
        return createDirectoryWithRetry(path, count + 1);
    }

    return result;
};

/**
 * Create new directory if it doesn't exist
 * @param path
 */
export const createDir = async (path: Path): Promise<PathInfo> => {
    const exists = await doesPathExist(path);
    if (exists) {
        return;
    }
    await createDirectory(path);
    return await getFormattedDetails(path);
};
/**
 * Read the requested dir
 * @param path
 * @param options
 */
export const readDir = async (
    path: Path,
    options: BaseEncodingOptions & { withFileTypes: true },
): Promise<PathInfo[]> => {
    const exists = await doesPathExist(path);
    if (!exists) return [];
    const content = await readDirectory(path, options);
    return (await Promise.all(content.map(c => {
        if (c.isBlockDevice() || c.isCharacterDevice() || c.isSymbolicLink() || c.isSocket())
            return;

        const itemPath = new Path(path.path);
        itemPath.appendPath(c.name);
        return getFormattedDetails(itemPath);
    }))).filter(c => c) as PathInfo[];
};

/**
 * Checks if the path does exist
 * @param path
 */
export const doesPathExist = async (
    path: Path,
): Promise<boolean> => {
    try {
        await FS.stat(path.securedPath);
        return true;
    } catch (e) {
        return false;
    }
};
export const isPathDirectory = async (
    path: Path,
): Promise<boolean> => {
    try {
        return await lstatSync(path.securedPath).isDirectory();
    } catch (e) {
        return false
    }
};

export const saveFileWithRetry = async (path: Path, file: UploadedFile, count = 0): Promise<PathInfo> => {
    const result = await saveUploadedFile(count === 0 ? path : new Path(path.path.insert(path.path.lastIndexOf('.'), ` (${count})`)), file);
    if (!result) {
        return await saveFileWithRetry(path, file, count + 1);
    }

    return result;
};
export const copyFileWithRetry = async (path: Path, file: Buffer, count = 0): Promise<PathInfo> => {
    const result = await copyFile(count === 0 ? path : new Path(path.path.insert(path.path.lastIndexOf('.'), ` (${count})`)), file);
    console.log(result);
    if (!result) {
        return await copyFileWithRetry(path, file, count + 1);
    }

    return result;
};
export const copyDirectoryWithRetry = async (path: Path, destPath: Path, count = 0): Promise<PathInfo> => {
    const result = await copyDir(count === 0 ? destPath : new Path(destPath.path.insert(destPath.path.length, ` (${count})`)), path);
    if (!result) {
        return await copyDirectoryWithRetry(path, destPath, count + 1);
    }

    return result;
};

/**
 * Saved file
 * @param path
 * @param file
 */
export const saveUploadedFile = async (
    path: Path,
    file: UploadedFile ,
) => {
    if (!Buffer.isBuffer(file.data)) {
        throw new FileSystemError(ErrorType.WrongFormat);
    }

    if (await doesPathExist(path)) return;
    return saveFile(path, file.data);
}


export const saveFile = async (
    path: Path,
    file: Buffer,
) => {


    const directory = new Path(path.path.removeAfterLastOccurrence('/'));
    if (!(await doesPathExist(directory))) {
        await createDir(directory);
    }

    await writeFile(path, file);
    return await getFormattedDetails(path);
};

/**
 * Copy the file to a new location on filesystem
 * @param path
 * @param file
 */
export const copyFile = async (path: Path, file: Buffer) => {
    if (!Buffer.isBuffer(file)) {
        throw new FileSystemError(ErrorType.WrongFormat);
    }
    if (await doesPathExist(path)) return;
    const directory = new Path(path.path.removeAfterLastOccurrence('/'));

    if (!(await doesPathExist(directory))) {
        await createDir(directory);
    }
    await writeFile(path, file);
    return await getFormattedDetails(path);
};
export const copyDir = async (destPath: Path, path: Path) => {
    if( !await doesPathExist(destPath) || path === destPath)
    {
        await copyDirectory(path, destPath);
        return await getFormattedDetails(destPath);
    }
    return undefined

};


/**
 * Copy the file to a new location on filesystem
 * @param oldPath
 * @param newPath
 * @param fileInfo
 */
export const moveFile = async (
    oldPath: Path,
    newPath: Path,
    fileInfo: FileInformation,
) => {
    if (!Buffer.isBuffer(fileInfo.data)) {
        throw new FileSystemError(ErrorType.WrongFormat);
    }
    if (!(await doesPathExist(newPath))) {
        await createDir(newPath);
    }

    oldPath.setPath(PATH.join(oldPath.path, fileInfo.name));
    newPath.setPath(PATH.join(newPath.path, fileInfo.name));
    await removeFile(oldPath);
    await writeFile(newPath, fileInfo.data);
    return await getFormattedDetails(newPath);
};


/**
 * Get the stream buffer of the decrypted file
 * @param path
 */
export const getFileStream = async (path: Path) => {
    const file = await readFile(path);
    const buffer = new ReadableStreamBuffer({
        frequency: 10,
        chunkSize: 2048,
    });
    buffer.put(file);
    buffer.stop();
    return buffer;
};
export const getFileData = async (path: Path) => {
    const fileDetails = await getDetails(path);

    if (!fileDetails) {
        throw new FileSystemError(ErrorType.FileNotFound);
    }

    const contentType = await getMimeType(path);
    const fileStream = await getFileStream(path);

    return {
        fileDetails,
        fileStream,
        contentType,
    };
};

const readFile = async (path: Path) => {
    return await FS.readFile(path.securedPath);
};

const createDirectory = (path: Path) => {
    return FS.mkdir(path.securedPath, { recursive: true });
};

const fileExists = async (path: Path) => {
    try {
        await FS.access(path.securedPath);
        return true;
    } catch (e) {
        return false;
    }
};

const readDirectory = async (
    path: Path,
    options: BaseEncodingOptions & { withFileTypes: true },
) => {
    return await FS.readdir(path.securedPath, options);
};

const writeFile = async (path: Path, file: Buffer) => {
    return await FS.writeFile(path.securedPath, file);
};
const copyDirectory = async (srcDir: Path, destDir: Path)=>{
    return await fse.copySync(srcDir.securedPath, destDir.securedPath)
}
export const removeFile = async (path: Path) => {
    if (await isPathDirectory(path)){
        return rmdirSync(path.securedPath, { recursive: true });
    }
    if (!(await doesPathExist(path))) {
        throw new FileSystemError(ErrorType.FileNotFound);
    }
    return await FS.rm(path.securedPath);
};

export const renameFile = async (oldPath: Path, newPath: Path) => {
    if (!(await doesPathExist(oldPath)) || await doesPathExist(newPath)) {
        return;
    }
    return await FS.rename(oldPath.securedPath, newPath.securedPath);
};

/**
 *
 * @param path
 */
export const getMimeType = async (path: Path) => {
    return mimeType.getType(path.securedPath);
};

export const getFileDetails = async (path: Path) => {
    return PATH.parse(path.securedPath);
};
