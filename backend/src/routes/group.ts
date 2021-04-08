import { Router } from 'express';
import { parseChat, parseFullChat } from '../service/chatService';
import { persistChat } from '../service/dataService';
import axios from 'axios';
import { sendEventToConnectedSockets } from '../service/socketService';
import { getFullIPv6ApiLocation } from '../service/urlService';
import { parseMessage, parseMessages } from '../service/messageService';

const router = Router();

router.put('/invite', async (req, res) => {
    console.log('received group invite');
    const chat = parseFullChat(req.body);
    console.log(chat);
    persistChat(chat);
    sendEventToConnectedSockets('connectionRequest', chat);
    res.sendStatus(200);
});

router.put('/', async (req, res) => {
    let preParsedChat = { ...req.body, acceptedChat: true, isGroup: true };
    const chat = parseFullChat(preParsedChat);
    console.log(chat);
    persistChat(chat);

    chat.contacts.forEach(async c => {
        const path = getFullIPv6ApiLocation(c.location, '/group/invite');
        console.log('sending group request to ', path);
        try {
            await axios.put(path, chat);
        } catch (e) {
            console.log('failed to send group request');
        }
    });

    res.json({ success: true });
});

export default router;
