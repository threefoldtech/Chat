import { persistChat } from './../service/dataService';
import { UploadedFile } from 'express-fileupload';
import { Router } from 'express';
import { user } from '../store/user';
import { connections } from '../store/connections';
import { getChat, saveFile } from '../service/dataService';
import { FileMessageType, MessageTypes } from '../types';
import Message from '../models/message';
import { config } from '../config/config';
import { sendEventToConnectedSockets } from '../service/socketService';
import { sendMessageToApi } from '../service/apiService';
import { getFullIPv6ApiLocation } from '../service/urlService';
import { getMyLocation } from '../service/locationService';

const router = Router();

router.get('/:chatid/:messageid/:name', async (req, res) => {
    // @TODO fix this security
    const path = `${config.baseDir}chats/${req.params.chatid}/files/${req.params.messageid}/${req.params.name}`;

    console.log('Path: ', path);

    res.download(path);
});

router.post('/:chatid/:messageid', async (req, resp) => {
    const chatId = req.params.chatid;
    const messageId = req.params.messageid;
    const fileToSave = <UploadedFile>req.files.file;
    saveFile(chatId, messageId,fileToSave.name, fileToSave.data);
    let myLocation = await getMyLocation();
    const message: Message<FileMessageType> = {
        from: config.userid,
        body: <FileMessageType>{
            filename: fileToSave.name,
            url: getFullIPv6ApiLocation(
                myLocation,
                `/files/${chatId}/${messageId}/${fileToSave.name}`
            ),
        },
        id: messageId,
        timeStamp: new Date(),
        to: chatId,
        type: MessageTypes.FILE,
        replies: [],
        subject: null,
    };
    sendEventToConnectedSockets('message', message);
    const chat = getChat(chatId);
    console.log('Sending TO: ', chat);
    sendMessageToApi(
        chat.contacts.find(contact => contact.id === chat.adminId).location,
        message
    );
    chat.addMessage(message);
    persistChat(chat);
    resp.sendStatus(200);
});

export default router;
