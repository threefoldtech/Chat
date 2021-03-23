import { Request } from 'express';
import { config } from '../config/config';
import { ThreefoldLogin } from '@threefoldjimber/threefold_login';
import { generateRandomString } from '@threefoldjimber/threefold_login/dist';

export const getAppLoginUrl = async (
    request: Request,
    redirectUrl: string
): Promise<string> => {
    const login = new ThreefoldLogin(
        config.appBackend,
        config.appId,
        config.seedPhrase,
        redirectUrl,
        config.kycBackend
    );
    await login.init();
    const loginState = generateRandomString();
    request.session.state = loginState;
    return login.generateLoginUrl(loginState);
};
export const appCallback = async (request: Request): Promise<string> => {
    console.log('Going to login now ...');

    const login = new ThreefoldLogin(
        config.appBackend,
        config.appId,
        config.seedPhrase,
        '', // No callback needed
        config.kycBackend
    );
    await login.init();
    const redirectUrl = new URL(
        request.protocol + '://' + request.get('host') + request.originalUrl
    );
    try {
        console.log(request.session);
        console.log(request.session.state);
        // @ts-ignore
        const profileData = (
            await login.parseAndValidateRedirectUrl(
                redirectUrl,
                request.session.state
            )
        )?.profile;

        delete request.session.state;

        const doubleName: string = <string>profileData.doubleName;
        let userId = doubleName.replace('.3bot', '');

        if (userId !== config.userid) {
            return '/unauthorized';
        }

        request.session.userId = userId;
        request.session.profileData = profileData;

        return '/callback';
    } catch (e) {
        throw new Error(e.message);
    }
};
