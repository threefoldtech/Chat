import { IdInterface, UserInterface } from './../types/index';
import { config } from '../config/config';
import fs from 'fs';
import Chat from '../models/chat';
import { parseChat } from './chatService';
import { uniqBy } from 'lodash';
import im from 'imagemagick';

export const getChatIds = (): IdInterface[] => {
    const location = config.baseDir + 'chats';
    const locations = fs.readdirSync(location);
    console.log(locations);
    return locations;
};

export const getChat = (id: IdInterface): Chat => {
    const path = config.baseDir + `chats/${id}/chat.json`;
    const chat: Chat = <Chat>JSON.parse(fs.readFileSync(path).toString());
    return parseChat(chat);
};

export const getUserdata = () => {
    const location = config.baseDir + 'user/userinfo.json';
    try {
        const data = JSON.parse(fs.readFileSync(location).toString());
        return data;
    } catch {
        throw new Error('Userinfo file doesn\'t exitst');
    }
};

const sortChat = (chat: Chat) => {
    const messages = uniqBy(chat.messages, m => m.id);

    messages.map(m => {
        const replies = uniqBy(m.replies, r => r.id);
        replies.sort((a, b) => a.timeStamp.getTime() - b.timeStamp.getTime());
        m.replies = replies;
    });

    messages.sort((a, b) => a.timeStamp.getTime() - b.timeStamp.getTime());

    chat.messages = messages;

    return chat;
};

export const persistChat = (chat: Chat) => {
    const sortedChat = sortChat(chat);

    const path = config.baseDir + `chats/${sortedChat.chatId}`;

    try {
        fs.statSync(path);
    } catch {
        fs.mkdirSync(path);
        fs.mkdirSync(path + '/files');
    }
    fs.writeFileSync(path + '/chat.json', JSON.stringify(sortedChat, null, 4), {
        flag: 'w',
    });
};
export const deleteChat = (chatId: string) => {
    const path = config.baseDir + `chats/${chatId}`;

    try {
        fs.rmdirSync(path, { recursive: true });
    } catch (e) {
        console.log(e);
        return false;
    }
    return true;
};

export const persistUserdata = (userData: UserInterface) => {
    const userdata = JSON.stringify(userData, null, 4);
    const location = config.baseDir + 'user/userinfo.json';
    fs.writeFileSync(location, userdata, { flag: 'w' });
    return;
};

export const saveFile = (
    chatId: IdInterface,
    messageId: string,
    fileName: string,
    fileBuffer: Buffer,
) => {
    let path = `${config.baseDir}chats/${chatId}/files/${messageId}`;
    fs.mkdirSync(path);
    path = `${path}/${fileName}`;
    fs.writeFileSync(path, fileBuffer);
    return path;
};

export const saveAvatar = async (fileBuffer: Buffer, id: string) => {
    const path = `${config.baseDir}user/avatar-${id}`;
    const tempPath = `${config.baseDir}user/temp-avatar-${id}`;
    fs.writeFileSync(tempPath, fileBuffer);
    await resizeAvatar(tempPath, path)
    fs.unlinkSync(tempPath);
};

export const deleteAvatar = (id: string) => {
    fs.unlinkSync(`${config.baseDir}user/avatar-${id}`);
};

export const resizeAvatar = async (from: string, to: string): Promise<unknown> => {
    return new Promise((resolve, reject) => {
        im.resize({
            srcPath: from,
            dstPath: to,
            width: 64,
        }, (err: Error, result) => {
            if(err) {
                reject(err);
            }
            resolve(result);
        });
    });
};

export const persistBlocklist = (blockList: string[]) => {
    const location = config.baseDir + 'user/blockList.json';
    fs.writeFileSync(location, JSON.stringify(blockList, null, 4), {
        flag: 'w',
    });
    return;
};

export const getBlocklist = (): string[] => {
    const location = config.baseDir + 'user/blockList.json';
    try {
        return JSON.parse(fs.readFileSync(location).toString());
    } catch {
        return [];
    }
};
