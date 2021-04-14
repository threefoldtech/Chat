import {
    ContactRequest,
    DtIdInterface,
    MessageInterface,
    MessageTypes,
} from './../types/index';
import { parseMessage } from './../service/messageService';
import { Router } from 'express';
import Contact from '../models/contact';
import Message from '../models/message';
import { config } from '../config/config';
import { contacts } from '../store/contacts';
import { sendMessageToApi } from '../service/apiService';
import { MessageBodyTypeInterface } from '../types';
import { addChat } from '../service/chatService';
import { uuidv4 } from '../common';
import { sendEventToConnectedSockets } from '../service/socketService';
import { getMyLocation } from '../service/locationService';
import { createSignedMessage } from '../service/encryptionService';

const router = Router();

router.get('/', (req, res) => {
    res.json(contacts);
});

router.post('/', async (req, res) => {
    const con = req.body;
    const contact = new Contact(con.id, con.location);

    console.log(`Adding contact  ${contact.id}`);
    contacts.push(contact);

    const message: MessageInterface<MessageBodyTypeInterface> = parseMessage(
        con.message
    );
    console.log(`creating chat`);
    const myLocation = await getMyLocation();
    const chat = addChat(
        contact.id,
        [contact, new Contact(config.userid, myLocation)],
        false,
        [message],
        contact.id,
        true,
        contact.id
    );

    // TODO clean this up
    if (!chat) {
        res.sendStatus(200);
        return;
    }

    const url = `/api/messages`;
    const data: Message<ContactRequest> = {
        id: uuidv4(),
        to: contact.id,
        body: {
            id: <DtIdInterface>contact.id,
            location: <string>myLocation,
        },
        from: config.userid,
        type: MessageTypes.CONTACT_REQUEST,
        timeStamp: new Date(),
        replies: [],
        subject: null,
    };
    console.log('sending to ', url);
    console.log(data);
    const signedMessage = createSignedMessage(data);
    await sendMessageToApi(contact.location, signedMessage);
    sendEventToConnectedSockets('connectionRequest', chat);
    res.sendStatus(200);
});

export default router;
