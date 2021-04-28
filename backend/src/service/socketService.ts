import { getChatById, persistMessage } from './chatService';
import { Socket } from 'socket.io';
import Message from '../models/message';
import { connections } from '../store/connections';
import * as http from 'http';
import { editMessage, handleRead, parseMessage } from './messageService';
import {
    MessageBodyTypeInterface,
    MessageTypes,
    StringMessageTypeInterface,
} from '../types';
import {
    deleteChat,
    getBlocklist,
    persistBlocklist,
} from './dataService';
import { sendMessageToApi } from './apiService';
import { updateLastSeen, updateStatus } from '../store/user';
import { config } from '../config/config';
import { appendSignatureToMessage } from './keyService';

const socketio = require('socket.io');

export let io: Socket;

export const startSocketIo = (httpServer: http.Server) => {
    io = socketio(httpServer, {
        cors: {
            origin: '*',
        },
    });

    io.on('connection', (socket: Socket) => {
        console.log(`${socket.id} connected`);
        connections.add(socket.id);

        socket.on('disconnect', () => {
            console.log(`${socket.id} disconnected`);
            connections.delete(socket.id);
            if (connections.getConnections().length === 0) {
                updateLastSeen();
            }
        });

        socket.on('message', messageData => {
            console.log('new message');

            const newMessage: Message<MessageBodyTypeInterface> = parseMessage(messageData.message);
            newMessage.from = config.userid;
            appendSignatureToMessage(newMessage);
            const chat = getChatById(newMessage.to);

            console.log(`internal send message to  ${chat.adminId}`);
            // sendMessage(chat.adminId, newMessage);

            // @todo refactor this
            connections.getConnections().forEach((connection: string) => {
                // if (connection == socket.id) {
                //     // this is me
                //     return
                // }

                io.to(connection).emit('message', newMessage);
                console.log(`send message to socket ${connection}`);
            });
            let location = chat.contacts.find(c => c.id == chat.adminId)
                .location;

            if (newMessage.type === MessageTypes.READ) {
                handleRead(<Message<StringMessageTypeInterface>>newMessage);
                sendMessageToApi(location, newMessage);
                return;
            }

            persistMessage(chat.chatId, newMessage);
            sendMessageToApi(location, newMessage);
        });

        socket.on('update_message', messageData => {
            console.log('updatemsgdata', messageData);
            const newMessage: Message<MessageBodyTypeInterface> = parseMessage(messageData.message);
            editMessage(messageData.chatId, newMessage);
            appendSignatureToMessage(newMessage);
            const chat = getChatById(messageData.chatId);
            let location1 = chat.contacts.find(c => c.id == chat.adminId)
                .location;
            sendMessageToApi(location1, newMessage);
        });
        socket.on('status_update', data => {
            const status = data.status;
            updateStatus(status);
        });
        socket.on('remove_chat', id => {
            const success = deleteChat(id);
            if (!success) {
                return;
            }
            sendEventToConnectedSockets('chat_removed', id);
        });
        socket.on('block_chat', id => {
            const blockList = getBlocklist();
            if(blockList.includes(id)) return;
            blockList.push(id);
            persistBlocklist(blockList);
            sendEventToConnectedSockets('chat_blocked', id);
        });
    });
};

export const sendEventToConnectedSockets = (event: string, body: any) => {
    connections.getConnections().forEach((connection: string) => {
        io.to(connection).emit(event, body);
        console.log(`send message to ${connection}`);
    });
};
