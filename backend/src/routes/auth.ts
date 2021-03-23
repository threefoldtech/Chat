import express, { Router } from 'express';
import session from 'express-session';
import { uuidv4 } from '../common';
import { appCallback, getAppLoginUrl } from '../service/authService';

const router = Router();

router.get('/', async (request, response) => {
    console.log('in session: ', request.session);
    if (!request.session.loggedIn) {
        console.log('We dont have a loggedIn session, we shouldnt login now.');
        response.json({ status: false });
    }

    response.json({ status: true });
});

router.get('/signin', async (request, response) => {
    const loginUrl = await getAppLoginUrl(request, `/api/auth/callback`);
    response.redirect(loginUrl);
});

router.get('/callback', async (request, response) => {
    const callback = await appCallback(request);

    if (callback && callback !== '/unauthorized') {
        console.log('request.session: ', request.session);
    }

    request.session.save(() => {
        response.redirect(callback);
    });
});

router.get('/authenticated', async (request, response) => {
    if (request.session.userId) {
        response.send('true');
        return;
    }
    response.send('false');
});

export default router;
