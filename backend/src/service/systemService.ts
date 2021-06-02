import Message from '../models/message';
import { ContactInterface, GroupUpdateType, MessageBodyTypeInterface, SystemMessageType } from '../types';
import { getChatById, persistMessage } from './chatService';
import Chat from '../models/chat';
import { deleteChat, persistChat } from './dataService';
import { config } from '../config/config';
import Contact from '../models/contact';
import { sendEventToConnectedSockets } from './socketService';
import { sendMessageToApi } from './apiService';

export const handleSystemMessage = (
    message: Message<{ contact: Contact; type: string }>,
    chat: Chat
) => {
    if (chat.adminId !== message.from) {
        throw Error('not allowed');
    }

    switch (message.body.type) {
        case SystemMessageType.ADDUSER:
            chat.contacts.push(message.body.contact);
            sendEventToConnectedSockets('chat_updated', chat);
            sendMessageToApi(message.body.contact.location, message);
            break;
        case SystemMessageType.REMOVEUSER:
            if (message.body.contact.id === config.userid) {
                deleteChat(<string>chat.chatId);
                sendEventToConnectedSockets('chat_removed', chat.chatId);
                return;
            }
            chat.contacts = chat.contacts.filter(
                c => c.id !== message.body.contact.id
            );
            sendMessageToApi(message.body.contact.location, message);
            break;
        case SystemMessageType.JOINED_VIDEOROOM: {
            persistMessage(chat.chatId, message)
            return;
        }
        case SystemMessageType.CONTACT_REQUEST_SEND: {
            persistMessage(chat.chatId, message)
            return;
        }
        default:
            throw Error('not implemented');
    }

    persistChat(chat);
};
