import { getKey, getUserdata, Key, persistUserdata, saveKey } from '../service/dataService';
import { config } from '../config/config';
import { getMyLocation } from '../service/locationService';

let status: string;
let image: string;
let id: string;
let lastSeen: number;
let privateKey: Uint8Array;
let publicKey: Uint8Array;

const setUserData = () => {
    try {
        const userData = getUserdata();
        status = userData.status;
        image = userData.image;
        id = userData.id;
        lastSeen = userData.lastSeen;
    } catch (error) {
        status = 'Exploring the new DigitalTwin';
        image = `default`;
        id = config.userid;
        saveUserData();
    }
};

const setKeys = () => {
    publicKey = getKey(Key.Public);
    privateKey = getKey(Key.Private);
}

export const getId = () => {
    return id;
}

export const getStatus = () => {
    return status;
};

export const getImage = () => {
    return image;
};

export const getPrivateKey = () => {
    return privateKey;
}
export const updatePrivateKey = (pk: Uint8Array) => {
    saveKey(pk, Key.Private);
    privateKey = pk;
}

export const getPublicKey = () => {
    return publicKey;
}
export const updatePublicKey = (pk: Uint8Array) => {
    saveKey(pk, Key.Public);
    publicKey = pk;
}

export const getAvatar = async () => {
    const myLocation = await getMyLocation();
    return `http://[${myLocation}]/api/user/avatar/${image}`;
};
export const getData = () => {
    return {
        status: status,
    };
};

export const getLastSeen = () => {
    return lastSeen;
};

const saveUserData = () => {
    persistUserdata({
        status: status,
        image: image,
        id: id,
        lastSeen: lastSeen,
    });
};

export const updateStatus = (newStatus: string) => {
    status = newStatus;
    saveUserData();
};

export const updateLastSeen = () => {
    lastSeen = new Date().getTime();
    saveUserData();
}

export const updateAvatar = (url:string) => {
    image = url;
    saveUserData();
}

setUserData();
setKeys();
