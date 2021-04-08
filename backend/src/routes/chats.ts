import { IdInterface } from './../types/index';
import { Router } from 'express';
import { appCallback, getAppLoginUrl } from '../service/authService';
import {
    getAcceptedChatsWithPartialMessages,
    getChatRequests,
    getChatById,
} from '../service/chatService';
import { getChat, persistChat } from '../service/dataService';
import { sendEventToConnectedSockets } from '../service/socketService';
import { config } from '../config/config';

const router = Router();

router.post('/', (req, res) => {
    if (!req.session.userId && process.env.ENVIRONMENT !== 'development') {
        res.send(401);
        return;
    }

    console.log(req.query.id);
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

router.get('/', (req, res) => {
    if (!req.session.userId && process.env.ENVIRONMENT !== 'development') {
        res.send(401);
        return;
    }

    const chats = getAcceptedChatsWithPartialMessages(20);
    res.json(chats);
});

//@TODO will need to use this later
router.get('/chatRequests', (req, res) => {
    if (!req.session.userId && process.env.ENVIRONMENT !== 'development') {
        res.send(401);
        return;
    }

    const returnChats = getChatRequests();
    res.json(returnChats);
});

router.get('/:chatId', (req, res) => {
    try {
        const chat = getChat(req.params.chatId);
        if (chat.adminId !== config.userid) {
            res.sendStatus(403);
            return;
        }
        res.json(chat);
    } catch (e) {
        res.sendStatus(403);
    }
});

export default router;
