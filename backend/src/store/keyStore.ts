import { getKey, Key, saveKey } from '../service/dataService';

interface KeyCache {
    [userId: string]: Uint8Array;
}

let cache: KeyCache = {};
let privateKey: Uint8Array;
let publicKey: Uint8Array;

export const getPublicKeyFromCache = (userId: string): Uint8Array | undefined => {
    return cache[userId];
};

export const setPublicKeyInCache = (userId: string, key: Uint8Array) => {
    cache = {
        ...cache,
        [userId]: key,
    };
};

const setKeys = () => {
    publicKey = getKey(Key.Public);
    privateKey = getKey(Key.Private);
};

export const initKeys = () => {
    console.log("Init keys")
    try {
        setKeys();
    } catch (ex) {
        console.log("Pub and private key not found, first time login no keys yet")
    }
}

export const getPrivateKey = () => {
    return privateKey;
};

export const updatePrivateKey = (pk: Uint8Array) => {
    saveKey(pk, Key.Private);
    privateKey = pk;
};

export const getPublicKey = () => {
    return publicKey;
};

export const updatePublicKey = (pk: Uint8Array) => {
    saveKey(pk, Key.Public);
    publicKey = pk;
};