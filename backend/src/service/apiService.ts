import { IdInterface } from './../types/index';
import axios from 'axios';
import Message from '../models/message';
import { MessageBodyTypeInterface } from '../types';
import { parseFullChat } from './chatService';
import { getFullIPv6ApiLocation } from './urlService';
import { Signed } from './encryptionService';

export const sendMessageToApi = async (
    location: string,
    message: Signed<Message<MessageBodyTypeInterface>>,
) => {
    console.log('Location: ', location);
    console.log('newMessage: ', message);
    const url = getFullIPv6ApiLocation(location, '/messages');
    try {
        await axios.put(url, message);
    } catch (e) {
        console.error(`couldn't send message ${url}`);
    }
};

export const getPublicKey = async(location: string) => {
    const url = getFullIPv6ApiLocation(location, '/publickey');
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (e) {
        console.error(`couldn't get publickey ${url}`);
    }
}

export const getChatfromAdmin = async (
    adminLocation: string,
    chatId: string
) => {
    const url = getFullIPv6ApiLocation(adminLocation, `/messages/${chatId}`);

    try {
        console.log('getting chat from ', url);
        const chat = await axios.get(url);
        const parsedChat = parseFullChat(chat.data,);
        console.log(parsedChat);
        return parsedChat;
    } catch {
        console.log('failed to get chat from admin');
        throw Error;
    }
    throw Error;
};
