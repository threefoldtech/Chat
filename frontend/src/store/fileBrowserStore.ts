import { ref, watch } from 'vue';
import * as Api from '@/services/fileBrowserService';

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

export const rootDirectory = '/';
export const currentDirectory = ref<string>(rootDirectory);
export const currentDirectoryContent = ref<PathInfoModel[]>([]);
export const selectedPaths = ref<PathInfoModel[]>([]);

watch([currentDirectory], () => updateContent());

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
};

export const uploadFiles = async (files: File[], path = currentDirectory.value) => {
    await Promise.all(files.map(async f => {
        const result = await Api.uploadFile(path, f);
        if ((result.status !== 200 && result.status !== 201) || !result.data)
            throw new Error('Could not create new folder');

        currentDirectoryContent.value.push(createModel(result.data));
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
    console.log("add", selectedPaths.value)
};

export const deselectItem = (item: PathInfoModel) => {
    selectedPaths.value = selectedPaths.value.filter(x => !(x.fullName === item.fullName && x.isDirectory === item.isDirectory && x.extension === item.extension));
    console.log("deselect", selectedPaths.value)
};

export const selectAll = () => {
    selectedPaths.value = [...currentDirectoryContent.value];
    console.log("selectall", selectedPaths.value)
}

export const deselectAll = () => {
    selectedPaths.value = [];
    console.log("deselectall", selectedPaths.value)
}

export const itemAction = (item: PathInfoModel) => {
    if (item.isDirectory) {
        goToFolderInCurrentDirectory(item);
        return;
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

export const createModel = (pathInfo: Api.PathInfo): PathInfoModel => {
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
