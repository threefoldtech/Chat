import express, { Router } from 'express';
import { MessageTypes } from '../types';
import Chat from '../models/chat';
import { uuidv4 } from '../common';
import { config } from '../config/config';
import { getChat, persistChat } from '../service/dataService';
import { getMyLocation } from '../service/locationService';
import request from 'request';
const router = Router();

router.get('/healthcheck', async (req, res) => {
    res.sendStatus(200);
});

router.get('/possibleMessages', async (req, res) => {
    res.json(MessageTypes);
});

router.get('/test', async (req, res) => {
    let id = uuidv4();
    getChat(id);
    const chat = new Chat(id, [], false, [], 'test', false, config.userid, {});

    persistChat(chat);
    res.json({ success: true });
});

router.get('/yggdrasil_address', async (req, res) => {
    let myLocation = await getMyLocation();
    res.json(myLocation);
});

router.get('/getexternalresource', (req: express.Request, res: express.Response) => {
    const url = req.query.resource as string;
    req.headers["content-disposition"] = "attachment";
    console.log("test", url);
    request(url, req).pipe(res);
})

export default router;
