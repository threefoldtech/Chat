import {
    getBlocklist,
    getChatIds,
    persistChat,
} from './../service/dataService';
import { Router } from 'express';
import Message from '../models/message';
import { contactRequests } from '../store/contactRequests';
import { sendEventToConnectedSockets } from '../service/socketService';
import {
    ContactRequest,
    DtIdInterface,
    GroupUpdateType,
    MessageBodyTypeInterface,
    MessageTypes,
    StringMessageTypeInterface,
} from '../types';
import Contact from '../models/contact';
import {
    editMessage,
    handleRead,
    parseMessage,
} from '../service/messageService';
import { persistMessage, syncNewChatWithAdmin } from '../service/chatService';
import { getChat } from '../service/dataService';
import { config } from '../config/config';
import { sendMessageToApi } from '../service/apiService';
import Chat from '../models/chat';
import { uuidv4 } from '../common';
import { handleGroupUpdate } from '../service/groupService';
import { getMyLocation } from '../service/locationService';

const router = Router();

async function handleContactRequest(message: Message<ContactRequest>) {
    contactRequests.push(<Contact>(<unknown>message.body));
    const otherContact = new Contact(
        <string>message.from,
        message.body.location
    );
    const myLocation = await getMyLocation();
    const myself = new Contact(<string>config.userid, myLocation);
    const requestMsg: Message<StringMessageTypeInterface> = {
        from: message.from,
        to: message.to,
        body: `You've received a new message request from ${message.from}`,
        id: uuidv4(),
        type: MessageTypes.STRING,
        timeStamp: new Date(),
        replies: [],
        subject: null,
    };
    const newchat = new Chat(
        message.from,
        [myself, otherContact],
        false,
        [requestMsg],
        <string>message.from,
        false,
        message.from
    );
    sendEventToConnectedSockets('connectionRequest', newchat);
    persistChat(newchat);
}

export const determinChatId = (
    message: Message<MessageBodyTypeInterface>
): DtIdInterface => {
    if (message.to === config.userid) {
        return message.from;
    }

    if (message.from === config.userid) {
        return message.to;
    }

    return message.to;
};

// Should be externally availble
router.put('/', async (req, res) => {
    // @ TODO check if valid
    const msg = req.body;
    let message: Message<MessageBodyTypeInterface>;
    try {
        message = parseMessage(msg);
    } catch (e) {
        res.status(500).json({ status: 'failed', reason: 'validation failed' });
        return;
    }

    const blockList = getBlocklist();

    const chatId = determinChatId(message);

    // const chatId = message.from === config.userid ? message.to : message.from;

    if (blockList.includes(<string>chatId)) {
        //@todo what should i return whenblocked
        res.json({ status: 'blocked' });
        return;
    }

    if (message.type === MessageTypes.CONTACT_REQUEST) {
        if (blockList.includes(<string>message.from)) {
            //@todo what should i return whenblocked
            res.json({ status: 'blocked' });
            return;
        }

        await handleContactRequest(message as Message<ContactRequest>);

        res.json({ status: 'success' });
        return;
    }

    if (message.type === MessageTypes.SYSTEM) {
        console.log('received a groupUpdate');
        //@ts-ignore
        const groupUpdateMsg: Message<GroupUpdateType> = message;
        if (
            groupUpdateMsg.body.type === 'ADDUSER' &&
            groupUpdateMsg.body.contact.id === config.userid
        ) {
            console.log('I have been added to a group!');
            syncNewChatWithAdmin(
                groupUpdateMsg.body.adminLocation,
                <string>groupUpdateMsg.to
            );
            res.json({ status: 'Successfully added chat' });
            return;
        }
    }

    let chat;
    try {
        chat = getChat(chatId);
    } catch (e) {
        console.log(e);
        res.status(403).json("Sorry but I'm not aware of this chat id");
        return;
    }

    if (chat.isGroup && chat.adminId == config.userid) {
        chat.contacts
            .filter(c => c.id !== config.userid)
            .forEach(c => {
                console.log(`group sendMessage to ${c.id}`);
                sendMessageToApi(c.location, message);
            });

        if (message.type === <string>MessageTypes.SYSTEM) {
            handleGroupUpdate(<any>message, chat);
            //@ts-ignore
            sendMessageToApi(message.body.contact.location, message);

            res.json({ status: 'success' });
            return;
        }

        console.log(`received new group message from ${message.from}`);
        sendEventToConnectedSockets('message', message);

        if (message.type === MessageTypes.READ) {
            handleRead(message as Message<StringMessageTypeInterface>);

            res.json({ status: 'success' });
            return;
        }

        if (
            message.type === MessageTypes.EDIT ||
            message.type === MessageTypes.DELETE
        ) {
            editMessage(chatId, message);
            sendEventToConnectedSockets('message', message);
            res.json({ status: 'success' });
            return;
        }

        console.log(`persistMessage:${chat.chatId}`);
        persistMessage(chat.chatId, message);
        res.json({ status: 'success' });
        return;
    }

    if (!chat && contactRequests.find(c => c.id == message.from)) {
        //@todo maybe 3 messages should be allowed or something
        res.status(403).json({
            status: 'Forbidden',
            reason: 'contact not yet approved',
        });
        return;
    }

    if (!chat) {
        res.status(403).json({ status: 'Forbidden', reason: 'not in contact' });
        return;
    }

    if (
        message.type === MessageTypes.EDIT ||
        message.type === MessageTypes.DELETE
    ) {
        editMessage(chatId, message);
        sendEventToConnectedSockets('message', message);
        res.json({ status: 'success' });
        return;
    }

    if (message.type === MessageTypes.READ) {
        handleRead(message as Message<StringMessageTypeInterface>);

        res.json({ status: 'success' });
        return;
    }

    if (message.type === <string>MessageTypes.SYSTEM) {
        handleGroupUpdate(<any>message, chat);

        res.json({ status: 'success' });
        return;
    }

    // const message = new Message(msg.from, msg.to, msg.body);
    console.log(`received new message from ${message.from}`);
    //
    persistMessage(chat.chatId, message);

    res.sendStatus(200);
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
