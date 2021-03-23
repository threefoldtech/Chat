import Message from '../models/message';
import { MessageBodyTypeInterface } from '../types';
import { getChatById } from './chatService';
import Chat from '../models/chat';
import { deleteChat, persistChat } from './dataService';
import { config } from '../config/config';
import Contact from '../models/contact';
import { sendEventToConnectedSockets } from './socketService';

export const handleGroupUpdate = (
    message: Message<{ contact: Contact; type: string }>,
    chat: Chat
) => {
    if (chat.adminId !== message.from) {
        throw Error('not allowed');
    }

    switch (message.body.type) {
        case 'ADDUSER':
            chat.contacts.push(message.body.contact);
            break;
        case 'REMOVEUSER':
            if (message.body.contact.id === config.userid) {
                deleteChat(<string>chat.chatId);
                sendEventToConnectedSockets('chat_removed', chat.chatId);
                return;
            }
            chat.contacts = chat.contacts.filter(
                c => c.id !== message.body.contact.id
            );
            break;
        default:
            throw Error('not implemented');
    }
    sendEventToConnectedSockets('chat_updated', chat);
    persistChat(chat);
};
