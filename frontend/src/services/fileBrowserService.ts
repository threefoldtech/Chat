import axios, { AxiosResponse, ResponseType } from 'axios';
import config from '../../public/config/config';
import { downloadFiles, PathInfoModel } from '@/store/fileBrowserStore';

const endpoint = `${config.baseUrl}api/browse`;

export interface PathInfo {
    isFile: boolean,
    isDirectory: boolean,
    path: string,
    fullName: string,
    name: string,
    size: number;
    extension: string;
    createdOn: Date;
    lastModified: Date;
    lastAccessed: Date;
}

export interface FullPathInfo extends PathInfo {
    key: string,
    readToken: string,
    writeToken: string;
}

export const getDirectoryContent = async (path: string): Promise<AxiosResponse<PathInfo[]>> => {
    const params = new URLSearchParams();
    params.append('path', path);
    return await axios.get<PathInfo[]>(`${endpoint}/directories/content`, {params: params});
};

export const getDirectoryInfo = async (path: string) => {
    const params = new URLSearchParams();
    params.append('path', path);
    return await axios.get(`${endpoint}/directories/info`, {params: params});
};

export const createDirectory = async (path: string, name: string): Promise<AxiosResponse<PathInfo>> => {
    const body = {
        path,
        name,
    };
    return await axios.post<PathInfo>(`${endpoint}/directories`, body);
};

export const getFileInfo = async (path: string): Promise<AxiosResponse<FullPathInfo>> => {
    const params = new URLSearchParams();
    params.append('path', path);
    return await axios.get(`${endpoint}/files/info`, { params: params });
};

export const uploadFile = async (path: string, file: File): Promise<AxiosResponse<PathInfo>> => {
    const formData = new FormData();
    formData.append('newFiles', file);
    formData.append('path', path)
    return await axios.post<PathInfo>(`${endpoint}/files`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
};

export const deleteFile = async (path: string) => {
    return await axios.delete<PathInfo>(`${endpoint}/files`, { data: { filepath: path}});
};

export const downloadFileEndpoint = `${endpoint}/files`;
export const getDownloadFileEndpoint = (path: string) => {
    return `${downloadFileEndpoint}?path=${path}`;
}

export const downloadFile = async (path: string, responseType: ResponseType = "blob") => {
    return await axios.get(getDownloadFileEndpoint(path), {
        responseType: responseType
    });
};
export const pasteFile = async (paths: PathInfo[], pathToPaste: string) => {
    console.log(paths);
    console.log(pathToPaste);
    return await axios.post<PathInfo[]>(`${endpoint}/files/copy`, { paths: paths, pathToPaste: pathToPaste});
};
export const renameFile = async (oldPath: string, newPath: string) => {
    return await axios.put<PathInfo>(`${endpoint}/files/rename`, { oldPath: oldPath, newPath: newPath });
};





