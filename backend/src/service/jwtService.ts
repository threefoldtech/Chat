import { sign, verify } from 'jsonwebtoken';
import { getPrivateKey } from '../store/keyStore';
import { config } from '../config/config';

export const createJwtToken = (data: any, exp: number,) => {
    const privateKey = getPrivateKey();
    return sign({
        data: data
    }, Buffer.from(privateKey), { expiresIn: exp, issuer: config.userid });
}

export const verifyJwtToken = <T extends object>(token: string): [payload: T, error: any] => {
    const privateKey = getPrivateKey();
    try {
        const payload = verify(token, Buffer.from(privateKey));
        return [payload as T, undefined];
    }
    catch (ex) {
        return [undefined, ex];
    }
}

