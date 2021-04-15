import { decodeBase64 } from 'tweetnacl-util';
import nacl, {SignKeyPair} from "tweetnacl"
import { getPrivateKey } from '../store/user';
import Message from '../models/message';

export const uint8ToString = (uint8array: Uint8Array) => {
    return Buffer.from(uint8array).toString('base64');
};

export const base64ToUint8Array = (base64: string) => {
    return new Uint8Array(decodeBase64(base64));
};

export const getKeyPair = (userSeed: string): SignKeyPair => {
    const seed = new Uint8Array(decodeBase64(userSeed));
    return nacl.sign.keyPair.fromSeed(seed);
};

export const appendSignature = <T>(message: Message<T>): Message<T> => {
    const secretKey = getPrivateKey();
    if(!secretKey) return;

    const messageString = JSON.stringify(message);
    const messageBase64 = Buffer.from(messageString).toString("base64")
    const signature = nacl.sign.detached(base64ToUint8Array(messageBase64), secretKey);
    message.signatures = [uint8ToString(signature), ...message.signatures];
}

export const verifySignature = <T>(message: Message<T>, signature: string, publicKey: Uint8Array) => {
    if(!publicKey) return;
    const index = message.signatures.findIndex(s => s === signature);
    const presentSignatures = message.signatures.slice(index, message.signatures.length);

    const messageString = JSON.stringify({
        ...message,
        signatures: presentSignatures
    } as Message<T>);
    const messageBase64 = Buffer.from(messageString).toString("base64")
    return nacl.sign.detached.verify(base64ToUint8Array(messageBase64), base64ToUint8Array(signature), publicKey);
}