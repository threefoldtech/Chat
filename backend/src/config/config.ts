let userid = process.env.USER_ID || 'please set your env var';

let appId = process.env.DIGITALTWIN_APPID || 'digitaltwin.jimbertesting.be';
let environment = process.env.ENVIRONMENT || 'production';

export const config = {
    appBackend: environment === 'production' ? 'https://login.threefold.me' : 'https://login.staging.jimber.org',
    kycBackend: environment === 'production' ? 'https://openkyc.live' : 'http://openkyc.staging.jimber.org',
    appId: `${userid}.${appId}`,
    seedPhrase:
        'calm science teach foil burst until next mango hole sponsor fold bottom cousin push focus track truly tornado turtle over tornado teach large fiscal',
    baseDir: '/appdata/',
    userid,
};
