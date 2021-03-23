import Contact from '../models/contact';
import { getChatIds, getChat } from '../service/dataService';
import { config } from '../config/config';
import Chat from '../models/chat';

//todo create propper contactArray
const chatIds = getChatIds();
const chats: Chat[] = getChatIds().map((chatId): Chat => getChat(chatId));
const contactList: Array<Contact> = chats
    .filter(chat => !chat.isGroup)
    .map(chat => {
        return chat.contacts.find(cont => cont.id !== config.userid);
    });

export let contacts: Array<Contact> = contactList;
