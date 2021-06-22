import { IdInterface } from '../types/index';
import express, { Router } from 'express';
import {
    getAcceptedChatsWithPartialMessages,
    getChatRequests,
    getChatById,
} from '../service/chatService';
import { getChat, persistChat } from '../service/dataService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { config } from '../config/config';
import { HttpError } from '../types/errors/httpError';
import { StatusCodes } from 'http-status-codes';

const router = Router();

router.post('/', (req: express.Request, res: express.Response) => {
    if (req.query.id) {
        console.log('accepting', req.query.id);
        //Flow to add contact request to contacts
        const id: IdInterface = <IdInterface>req.query.id;
        console.log('accepting', id);
        let chat = getChatById(id);
        chat.acceptedChat = true;
        sendEventToConnectedSockets('new_chat', chat);
        persistChat(chat);
        res.json(chat);
        return;
    }
});

router.get('/', (req: express.Request, res: express.Response) => {
    let limit = parseInt(<string | undefined>req.query.limit);
    limit = limit > 100 ? 100 : limit;

    const chats = getAcceptedChatsWithPartialMessages(limit);
    res.json(chats);
});

//@TODO will need to use this later
router.get('/chatRequests', (req: express.Request, res: express.Response) => {
    const returnChats = getChatRequests();
    res.json(returnChats);
});

router.get('/:chatId', (req: express.Request, res: express.Response) => {
    const chat = getChat(req.params.chatId);
    if (!chat.contacts.some(x => x.id !== config.userid)) {
        throw new HttpError(StatusCodes.FORBIDDEN);
    }
    res.json(chat);
});

export default router;
