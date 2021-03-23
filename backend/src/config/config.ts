let userid = process.env.USER_ID || 'please set your env var';
let appId = process.env.DIGITALTWIN_APPID || 'digitaltwin.jimbertesting.be';

export const config = {
    appBackend: 'https://login.threefold.me',
    kycBackend: 'https://openkyc.live',
    appId: `${userid}.${appId}`,
    seedPhrase:
        'calm science teach foil burst until next mango hole sponsor fold bottom cousin push focus track truly tornado turtle over tornado teach large fiscal',
    baseDir: '/appdata/',
    userid,
};
