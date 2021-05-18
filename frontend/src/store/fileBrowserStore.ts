import { ref, watch } from 'vue';
import fileDownload from 'js-file-download';
import * as Api from '@/services/fileBrowserService';
import { Router, useRouter } from 'vue-router';

export enum FileType {
    Unknown,
    Word,
    Video,
    Pdf,
    Csv,
    Audio,
    Archive,
    Excel,
    Powerpoint,
    Image
}

export interface PathInfoModel extends Api.PathInfo {
    fileType: FileType;
}

export interface FullPathInfoModel extends Api.FullPathInfo {
    fileType: FileType;
}

export const rootDirectory = '/';
export const currentDirectory = ref<string>(rootDirectory);
export const currentDirectoryContent = ref<PathInfoModel[]>([]);
export const selectedPaths = ref<PathInfoModel[]>([]);
export const copyStatus = ref<string>('Copy Selected');
export const copiedFiles = ref<PathInfoModel[]>([]);

watch([currentDirectory], () => updateContent());

function pathJoin(parts, separator = '/') {
    const replace = new RegExp(separator + '{1,}', 'g');
    return parts.join(separator).replace(replace, separator);
}

export const getFile = async (fullPath: string): Promise<FullPathInfoModel> => {
    const result = await Api.getFileInfo(fullPath);
    if (result.status !== 200 || !result.data)
        throw new Error('Could not get file');

    return createModel(result.data) as FullPathInfoModel;
};

export const updateContent = async (path = currentDirectory.value) => {
    const result = await Api.getDirectoryContent(path);
    if (result.status !== 200 || !result.data)
        throw new Error('Could not get content');

    currentDirectoryContent.value = result.data.map(createModel);
};

export const createDirectory = async (name: string, path = currentDirectory.value) => {
    const result = await Api.createDirectory(path, name);
    if (result.status !== 201 || !result.data)
        throw new Error('Could not create new folder');

    currentDirectoryContent.value.push(createModel(result.data));
    await updateContent();
};

export const uploadFiles = async (files: File[], path = currentDirectory.value) => {
    await Promise.all(files.map(async f => {
        const result = await Api.uploadFile(path, f);
        if ((result.status !== 200 && result.status !== 201) || !result.data)
            throw new Error('Could not create new folder');

        currentDirectoryContent.value.push(createModel(result.data));
        await updateContent();
    }));
};

export const deleteFiles = async () => {
    await Promise.all(selectedPaths.value.map(async f => {
        const result = await Api.deleteFile(f.directory);
        if (result.status !== 200 && result.status !== 201)
            throw new Error('Could not delete file');
        selectedPaths.value = [];
        await updateContent();

    }));
};
export const downloadFiles = async () => {
    await Promise.all(selectedPaths.value.map(async f => {
        const result = await Api.downloadFile(f.directory);
        if (result.status !== 200 && result.status !== 201)
            throw new Error('Could not download file');

        fileDownload(result.data, f.fullName);
        selectedPaths.value = [];
    }));
};

export const goToFolderInCurrentDirectory = (item: PathInfoModel) => {
    let currentPath = currentDirectory.value;
    if (!currentPath || currentPath[currentPath.length - 1] !== rootDirectory) currentPath += '/';
    currentPath += item.name;
    currentDirectory.value = currentPath;
};

export const goToHome = () => {
    currentDirectory.value = rootDirectory;
};
export const copyPasteSelected = async () => {
    //copy
    if (copiedFiles.value.length === 0) {
        copiedFiles.value = selectedPaths.value;
        selectedPaths.value = [];
        copyStatus.value = `Paste ${copiedFiles.value.length} files`;
        return;
    }
    //paste
    await Promise.all(copiedFiles.value.map(async f => {
        const result = await Api.pasteFile(f.directory, currentDirectory.value, f.fullName);
        if (result.status !== 200 && result.status !== 201)
            throw new Error('Could not paste file');
    }));
    copiedFiles.value = [];
    selectedPaths.value = [];
    copyStatus.value = `Copy Selected`;
    await updateContent();

};
export const clearClipboard = () => {
    copyStatus.value = `Copy Selected`;
    copiedFiles.value = [];

};
export const renameFile = async (item: PathInfoModel, name: string) => {
    if (name === ''){
        return
    }
    const oldPath = item.directory;
    let newPath = ""
    if (item.extension != ""){
        newPath = currentDirectory.value + '/' + name + '.' + item.extension;
    }else{
        newPath = currentDirectory.value + '/' + name;
    }

    const result = await Api.renameFile(oldPath, newPath);
    console.log(result.status);
    if (result.status !== 201)
        throw new Error('Could not rename file');

    selectedPaths.value = [];
    await updateContent();
};

export const goToAPreviousDirectory = (index: number) => {
    if (currentDirectory.value === rootDirectory) return;
    const parts = currentDirectory.value.split('/');
    if (index < 1 || index === parts.length - 1) return;
    parts.splice(index + 1);
    currentDirectory.value = parts.join('/');
};

export const goBack = () => {
    if (currentDirectory.value === rootDirectory) return;
    const parts = currentDirectory.value.split('/');
    parts.pop();
    currentDirectory.value = parts.join('/');
};

export const selectItem = (item: PathInfoModel) => {
    selectedPaths.value.push(item);
};

export const deselectItem = (item: PathInfoModel) => {
    selectedPaths.value = selectedPaths.value.filter(x => !(x.fullName === item.fullName && x.isDirectory === item.isDirectory && x.extension === item.extension));
};

export const selectAll = () => {
    selectedPaths.value = [...currentDirectoryContent.value];
};

export const deselectAll = () => {
    selectedPaths.value = [];
};

export const itemAction = (item: PathInfoModel, router: Router, path = currentDirectory.value) => {
    if (item.isDirectory) {
        goToFolderInCurrentDirectory(item);
        return;
    }

    if ([FileType.Excel, FileType.Word, FileType.Powerpoint].some(x => x === item.fileType)) {
        router.push({ name: 'editfile', params: { id: btoa(pathJoin([path, item.fullName])) } });
    }
};


export const getIcon = (item: PathInfoModel) => {
    if (item.isDirectory) return 'far fa-folder';
    switch (item.fileType) {
        case FileType.Video:
            return 'far fa-file-video';
        case FileType.Word:
            return 'far fa-file-word';
        case FileType.Image:
            return 'far fa-file-image';
        case FileType.Pdf:
            return 'far fa-file-pdf';
        case FileType.Csv:
            return 'far fa-file-csv';
        case FileType.Audio:
            return 'far fa-file-audio';
        case FileType.Archive:
            return 'far fa-file-archive';
        case FileType.Excel:
            return 'far fa-file-excel';
        case FileType.Powerpoint:
            return 'far fa-file-powerpoint';
        default:
            return 'far fa-file';
    }
};

export const createModel = <T extends Api.PathInfo>(pathInfo: T): PathInfoModel => {
    console.log(pathInfo);
    return {
        ...pathInfo,
        fileType: pathInfo.isDirectory ? FileType.Unknown : getFileType(pathInfo.extension?.toLowerCase()),
    };
};

export const getFileType = (extension: string): FileType => {
    switch (extension?.toLowerCase()) {
        case 'webm':
        case 'mpg':
        case 'mpeg':
        case 'mp4':
        case 'avi':
        case 'wmv':
        case 'flv':
        case 'mov':
        case 'swf':
            return FileType.Video;
        case 'doc':
        case 'docm':
        case 'docx':
        case 'dot':
        case 'dotm':
        case 'dotx':
            return FileType.Word;
        case 'jpg':
        case 'jpeg':
        case 'tiff':
        case 'png':
        case 'bmp':
        case 'gif':
        case 'webp':
        case 'svg':
            return FileType.Image;
        case 'pdf':
            return FileType.Pdf;
        case 'csv':
            return FileType.Csv;
        case 'm4a':
        case 'flac':
        case 'mp3':
        case 'wav':
        case 'wma':
        case 'aac':
            return FileType.Audio;
        case '7z':
        case 'tar.bz2':
        case 'bz2':
        case 'tar.gz':
        case 'zip':
        case 'zipx':
        case 'gz':
        case 'rar':
            return FileType.Archive;
        case 'xlsx':
        case 'xlsm':
        case 'xlsb':
        case 'xltx':
        case 'xltm':
        case 'xls':
        case 'xlt':
        case 'xlam':
        case 'xla':
        case 'xlw':
        case 'xlr':
        case 'xlam':
            return FileType.Excel;
        case 'potm':
        case 'ppa':
        case 'ppam':
        case 'pps':
        case 'ppsm':
        case 'ppsx':
        case 'ppt':
        case 'pptm':
        case 'pptx':
            return FileType.Powerpoint;
        default:
            return FileType.Unknown;
    }
};
