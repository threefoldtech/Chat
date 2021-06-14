import { getShareConfig, persistShareConfig } from './dataService';
import user from '../routes/user';
import { uuidv4 } from '../common';

interface ShareInterface {
    isPublic: boolean;
    userId: string;
    token: string;
    expiration?: number;
}

export interface FileSharesInterface {
    [id: string]: {
        path: string;
        shares: ShareInterface[];
    }
}

function epoch(date: Date = new Date()) {
    return (new Date(date)).getTime();
}

function epochToDate(epoch: number ) {
    if (epoch < 10000000000)
        epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
    epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone
    return new Date(epoch);
}

export const removeExpiredShares = () => {
    const config = getShareConfig();
    for (const key in config) {
        const value = config[key];
        value.shares = value.shares.filter(s => !s.expiration || (s.expiration && s.expiration < epoch(new Date())));
    }
    persistShareConfig(config);
}

export const initFileShares = () => {
    removeExpiredShares();
}

export const getPathIndex =  (config: FileSharesInterface, path: string) => {
    return Object.keys(config).find(x => {
        const share = config[x];
        return share.path === path;
    });
}

export const createOrUpdateShare = (path: string, userId?: string, expiration?: number) => {
    const config = getShareConfig();
    let index = getPathIndex(config, path);
    if(!index) {
        index = uuidv4();
        config[index] = {
            path: path,
            shares: []
        }
    }
    const shares = config[index].shares;
    const shareIndex = shares.findIndex(x => !userId ? x.isPublic : x.userId === userId);
    if(shareIndex === -1) {
        shares.push({
            userId: userId,
            isPublic: !userId,
            expiration: expiration ? epoch() + expiration : undefined
        } as ShareInterface)
    }
}