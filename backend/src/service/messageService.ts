import {
    ContactRequest,
    FileMessageType,
    IdInterface,
    MessageBodyTypeInterface,
    MessageInterface,
    MessageTypes,
    StringMessageTypeInterface,
} from '../types';
import Message from '../models/message';
import {getChat, persistChat, saveFile} from './dataService';
import {sendEventToConnectedSockets} from './socketService';
import {determineChatId} from '../routes/messages';
import {logger} from "../logger";

export const parseMessages = (messages: Array<any>) => messages.map(parseMessage);

export const parseMessage = (
    msg: any,
): MessageInterface<MessageBodyTypeInterface> => {
    const type: MessageTypes = <MessageTypes>msg.type;

    // console.log('MESSAGE: ', msg);

    switch (type) {
        case MessageTypes.STRING:
            return new Message<StringMessageTypeInterface>(
                msg.from,
                msg.to,
                msg.body,
                new Date(msg.timeStamp),
                msg.id,
                type,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.GIF:
            return new Message<StringMessageTypeInterface>(
                msg.from,
                msg.to,
                msg.body,
                new Date(msg.timeStamp),
                msg.id,
                type,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.CONTACT_REQUEST:
            return new Message<ContactRequest>(
                msg.from,
                msg.to,
                <ContactRequest>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                type,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.GROUP_UPDATE:
            return new Message<any>(
                msg.from,
                msg.to,
                <any>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                type,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.FILE_UPLOAD:
            const url = saveFile(
                msg.to,
                msg.id,
                msg.body.name,
                msg.body.parsedFile,
            );

            return new Message<FileMessageType>(
                msg.from,
                msg.to,
                <FileMessageType>{filename: msg.body.name},
                new Date(msg.timeStamp),
                msg.id,
                MessageTypes.FILE,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.FILE:
            return new Message<FileMessageType>(
                msg.from,
                msg.to,
                <FileMessageType>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                type,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.EDIT:
            return new Message<StringMessageTypeInterface>(
                msg.from,
                msg.to,
                <String>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                MessageTypes.EDIT,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.DELETE:
            return new Message<StringMessageTypeInterface>(
                msg.from,
                msg.to,
                <String>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                MessageTypes.DELETE,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.QUOTE:
            return new Message<StringMessageTypeInterface>(
                msg.from,
                msg.to,
                <String>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                MessageTypes.QUOTE,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
        case MessageTypes.READ:
            return new Message<StringMessageTypeInterface>(
                msg.from,
                msg.to,
                <String>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                MessageTypes.READ,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );

        default:
            return new Message<MessageBodyTypeInterface>(
                msg.from,
                msg.to,
                <String>msg.body,
                new Date(msg.timeStamp),
                msg.id,
                msg.type,
                msg.replies
                    ? [...msg.replies?.map((r: any) => parseMessage(r))]
                    : [],
                msg?.subject,
                msg?.signatures,
                msg?.updated
            );
    }
};
export const editReply = (chatId: IdInterface, newMessage: Message<MessageBodyTypeInterface>) => {
    const chat = getChat(chatId);
    const messageIndex = chat.messages.findIndex(mes => mes.id === newMessage.subject);
    if (messageIndex === -1) {
        return;
    }

    const replyIndex = chat.messages[messageIndex]?.replies?.findIndex(r => r.id === newMessage.id);
    if (replyIndex === -1) {
        return;
    }

    chat.messages[messageIndex].replies[replyIndex].body = newMessage.body;
    chat.messages[messageIndex].replies[replyIndex].updated = new Date();
    persistChat(chat);
};

export const editMessage = (
    chatId: IdInterface,
    newMessage: Message<MessageBodyTypeInterface | Message<MessageBodyTypeInterface>>,
) => {
    if (newMessage.subject) {
        editReply(chatId, newMessage);
        return;
    }
    const chat = getChat(chatId);

    switch (newMessage.type) {
        case MessageTypes.DELETE: {
            const index = chat.messages.findIndex(mes => mes.id === newMessage.id);
            chat.messages[index].body = newMessage.body;
            chat.messages[index].type = MessageTypes.DELETE;
            break;
        }

        case MessageTypes.EDIT: {
            const editedMessage = parseMessage(newMessage.body);
            //@todo: error handling when not parsed
            const index = chat.messages.findIndex(mes => mes.id === editedMessage.id);
            chat.messages[index] = editedMessage;
            break;
        }
    }
    persistChat(chat);
};


export const handleRead = (message: Message<StringMessageTypeInterface>) => {
    // console.log('reading');

    let chatId = determineChatId(message);
    const chat = getChat(chatId);

    const newRead = chat.messages.find(m => m.id === message.body);
    const oldRead = chat.messages.find(
        m => m.id === chat.read[<string>message.from],
    );

    if (
        oldRead &&
        newRead &&
        newRead.timeStamp.getTime() < oldRead.timeStamp.getTime()
    ) {
        return;
    }

    chat.read[<string>message.from] = <string>message.body;
    persistChat(chat);
    sendEventToConnectedSockets('message', message);
};
