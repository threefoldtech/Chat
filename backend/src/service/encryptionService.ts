import { decodeBase64 } from 'tweetnacl-util';
import nacl, {SignKeyPair} from "tweetnacl"
import Message from '../models/message';

export const uint8ToString = (uint8array: Uint8Array) => Buffer.from(uint8array).toString('base64');
export const base64ToUint8Array = (base64: string) => new Uint8Array(decodeBase64(base64));
export const objectToBase64 = (data: any): string => Buffer.from(JSON.stringify(data)).toString("base64");
export const objectToUint8Array = (data: any): Uint8Array => base64ToUint8Array(objectToBase64(data));

export const getKeyPair = (userSeed: string): SignKeyPair => {
    const seed = new Uint8Array(decodeBase64(userSeed));
    return nacl.sign.keyPair.fromSeed(seed);
};

export const appendSignature = <T>(message: Message<T>, secretKey: Uint8Array): Message<T> => {
    if(!secretKey) return;
    const messageString = JSON.stringify(message);
    const messageBase64 = Buffer.from(messageString).toString("base64")
    const signature = nacl.sign.detached(base64ToUint8Array(messageBase64), secretKey);
    message.signatures = [uint8ToString(signature), ...message.signatures];
}


export const createSignature = (data: any, secretKey: Uint8Array) => {
    if(!secretKey || !data) return;
    return nacl.sign.detached(objectToUint8Array(data), secretKey);
}

export const createBase64Signature = (data: any, secretKey: Uint8Array) => {
    const signature = createSignature(data, secretKey);
    if(!signature) return;
    return uint8ToString(signature);
}

export const verifySignature = (data: any, signature: string, publicKey: Uint8Array) => {
    return nacl.sign.detached.verify(objectToUint8Array(data), base64ToUint8Array(signature), publicKey);
}