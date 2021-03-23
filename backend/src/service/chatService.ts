import { DtIdInterface, MessageInterface } from './../types/index';
import Chat from '../models/chat';
import Message from '../models/message';
import { IdInterface, MessageBodyTypeInterface } from '../types';
import Contact from '../models/contact';
import { getChatIds, persistChat, getChat } from './dataService';
import messages from '../routes/messages';
import { parseMessage } from './messageService';
import { sendEventToConnectedSockets } from './socketService';
import { logger } from '../logger';
import { getChatfromAdmin } from './apiService';
import { config } from '../config/config';

export const persistMessage = (
    chatId: IdInterface,
    message: MessageInterface<MessageBodyTypeInterface>
) => {
    const chat = getChat(chatId);
    if (!message.subject) {
        chat.messages.push(message);
        persistChat(chat);
        sendEventToConnectedSockets('message', message);
        return;
    }

    const subjectMessageIndex = chat.messages.findIndex(
        m => m.id === message.subject
    );
    const subjectMessage = chat.messages[subjectMessageIndex];
    subjectMessage.replies = [...subjectMessage.replies, message];
    chat.messages[subjectMessageIndex] = subjectMessage;

    // logger.info(subjectMessage)
    persistChat(chat);
    sendEventToConnectedSockets('message', chat.messages[subjectMessageIndex]);
};

export const addChat = (
    chatId: IdInterface,
    contacts: Contact[],
    isGroupchat: boolean,
    message: MessageInterface<MessageBodyTypeInterface>[],
    name: string,
    acceptedChat: boolean,
    adminId: DtIdInterface
) => {
    const chat = new Chat(
        chatId,
        contacts,
        isGroupchat,
        message,
        name,
        acceptedChat,
        adminId,
        {}
    );
    // @TODO clean this up
    if (chat.chatId == config.userid) {
        return null;
    }
    persistChat(chat);
    sendEventToConnectedSockets('new_chat', chat);
    return chat;
};

export const syncNewChatWithAdmin = async (
    adminLocation: string,
    chatId: string
) => {
    const chat = await getChatfromAdmin(adminLocation, chatId);
    console.log('retreived chat', chat);
    sendEventToConnectedSockets('new_chat', chat);
    persistChat(chat);
};

export const getMessagesFromId = (chatId: IdInterface) => true;

export const setChatToAccepted = (chatId: IdInterface) => true;

//@TODO filter for acceptedchatss
export const getAcceptedChats = () => {
    return getChatIds().map(chatid => getChat(chatid));
    // .filter((chat) => chat.acceptedChat);
};

// @TODO will need to use this later
export const getChatRequests = () => {
    return getChatIds()
        .map(chatid => getChat(chatid))
        .filter(chat => !chat.acceptedChat);
};

export const getChatById = (id: IdInterface) => {
    return getChat(id);
};

export const parseChat = (chat: any) => {
    const messages = chat.messages.map((m: any) => parseMessage(m));
    return new Chat(
        chat.chatId,
        chat.contacts,
        chat.isGroup,
        messages,
        chat.name,
        chat.acceptedChat,
        chat.adminId,
        chat.read
    );
};
