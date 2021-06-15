import { getShareConfig, persistShareConfig } from './dataService';
import user from '../routes/user';
import { uuidv4 } from '../common';
import { createJwtToken } from './jwtService';
import { Permission } from '../store/tokenStore';

interface ShareInterface {
    isPublic: boolean;
    userId: string | undefined;
    expiration?: number;
    writable: boolean;
}

export interface FileSharesInterface {
    [id: string]: {
        path: string;
        shares: ShareInterface[];
    }
}

export interface ShareTokenData {
    id: string;
    userId: string;
}

export interface ShareWithIdInterface extends ShareInterface{
    id: string
}

function epoch(date: Date = new Date()) {
    return (new Date(date)).getTime();
}

function epochToDate(epoch: number) {
    if (epoch < 10000000000)
        epoch *= 1000; // convert to milliseconds (Epoch is usually expressed in seconds, but Javascript uses Milliseconds)
    epoch = epoch + (new Date().getTimezoneOffset() * -1); //for timeZone
    return new Date(epoch);
}

export const removeExpiredShares = (config: FileSharesInterface) => {
    for (const key in config) {
        const value = config[key];
        value.shares = value.shares.filter(s => !s.expiration || (s.expiration && s.expiration < epoch()));
    }
};

export const initFileShares = () => {
    let config = getShareConfig();
    removeExpiredShares(config);
    persistShareConfig(config);
};

export const getPathId = (config: FileSharesInterface, path: string): string => {
    return Object.keys(config).find(x => {
        const share = config[x];
        return share.path === path;
    });
};

export const getShare = (config: FileSharesInterface, path: string, userId: string): ShareWithIdInterface => {
    let index = getPathId(config, path);
    if (!index) return;
    return {
        id: index,
        ...config[index].shares.find(x => !userId ? x.isPublic : x.userId === userId),
    } as ShareWithIdInterface;
};

export const appendShare = (config: FileSharesInterface, path: string, share: ShareInterface): ShareWithIdInterface => {
    let index = getPathId(config, path);
    if (!index) {
        index = uuidv4();
        config[index] = {
            path: path,
            shares: [],
        };
    }
    const shares = config[index].shares;
    const alreadyExists = shares.some(x => !share.userId ? x.isPublic : x.userId === share.userId);
    if (alreadyExists)
        throw new Error(`Share for user ${share.userId ?? 'public'} already exists`);
    shares.push(share);
    return {
        id: index,
        ...share,
    } as ShareWithIdInterface;
};

export const updateShare = (config: FileSharesInterface, path: string, userId: string | undefined, expiration?: number, writable?: boolean) => {
    let index = getPathId(config, path);
    if (!index)
        throw new Error(`Share for user ${userId ?? 'public'} does not exists`);
    const share = config[index].shares.find(x => !userId ? x.isPublic : x.userId === userId);

    if (expiration !== undefined)
        share.expiration = expiration === 0 ? undefined : expiration;

    if (writable !== undefined)
        share.writable = writable;

    return {
        id: index,
        ...share
    }
};

export const deleteShare = (config: FileSharesInterface, path: string, userId?: string) => {
    let index = getPathId(config, path);
    if (!index)
        return;

    config[index].shares = config[index].shares.filter(x => !userId ? !x.isPublic : x.userId !== userId);
};



const createPublicShare = (path: string, expiration = 15 * 60 * 1000) => {

};

export const createShare = (path: string, userId: string | undefined, isPublic: boolean , writable: boolean) => {
    const config = getShareConfig();
    const share = getShare(config, path, undefined);
    let result: ShareWithIdInterface;
    if (!share)
        result = appendShare(config, path, {
            isPublic: isPublic,
            writable: writable,
            expiration: isPublic ? epoch() + (15 * 60 * 1000) : undefined,
            userId: userId,
        });

    return createJwtToken({
        id: result.id,
        userId: result.userId
    } as ShareTokenData)
}

