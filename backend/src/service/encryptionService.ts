import { decodeBase64 } from 'tweetnacl-util';
import nacl, {SignKeyPair} from "tweetnacl"
import { getPrivateKey } from '../store/user';

export interface Signed<T> {
    original: T,
    signatures: Array<string>
}

export const isSigned = (message: any) => {
    const m = message as Signed<any>;
    return m.signatures && m.signatures.length > 0;
}

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

export const createSignedMessage = <T>(message: T): Signed<T> | undefined => {
    const secretKey = getPrivateKey();
    console.log(secretKey)
    if(!secretKey) return;

    const messageString = JSON.stringify(message);
    const encodedMessageString = Buffer.from(messageString).toString("base64");

    const signature = nacl.sign.detached(base64ToUint8Array(encodedMessageString), secretKey);
    return {
        original: message,
        signatures: [uint8ToString(signature)]
    } as Signed<T>
}

export const appendSignature = <T>(message: Signed<T>): Signed<T> => {
    const secretKey = getPrivateKey();
    if(!secretKey) return;

    const signature = nacl.sign.detached(base64ToUint8Array(JSON.stringify(message.original)), secretKey);
    return {
        ...message,
        signatures: [uint8ToString(signature), ...message.signatures]
    } as Signed<T>
}

export const verifySignature = <T>(message: Signed<T>, signature: string, publicKey: Uint8Array) => {
    if(!publicKey) return;
    return nacl.sign.detached.verify(base64ToUint8Array(JSON.stringify(message.original)), base64ToUint8Array(signature), publicKey);
}