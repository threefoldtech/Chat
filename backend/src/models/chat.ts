import Contact from './contact';
import Message from './message';
import {
    ChatInterface,
    DtIdInterface,
    MessageBodyTypeInterface,
} from '../types';
import { user } from '../store/user';

export default class Chat implements ChatInterface {
    chatId: String;
    contacts: Contact[];
    isGroup: boolean;
    messages: Message<MessageBodyTypeInterface>[];
    name: string;
    acceptedChat: boolean;
    adminId: DtIdInterface;
    read: { [key: string]: string } = {};

    constructor(
        chatId: String,
        contacts: Contact[],
        isGroup: boolean,
        messages: Message<MessageBodyTypeInterface>[],
        name: string,
        acceptedChat: boolean,
        adminId: DtIdInterface,
        read: { [key: string]: string } = {}
    ) {
        this.chatId = chatId;
        this.contacts = contacts;
        this.isGroup = isGroup;
        this.messages = messages;
        this.name = name;
        this.acceptedChat = acceptedChat;
        this.adminId = adminId;
        this.read = read;
    }

    addMessage(message: Message<MessageBodyTypeInterface>) {
        this.messages.push(message);
    }
}
