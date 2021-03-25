import { reactive } from '@vue/reactivity';
import { ref, toRefs } from 'vue';
import axios from 'axios';
import moment from 'moment';
import {
    Chat,
    Contact,
    GroupChat,
    GroupManagementBody,
    Message,
    MessageBodyType,
    MessageTypes,
    SystemBody,
    SystemMessageTypes,
} from '../types';
import { useSocketActions } from './socketStore';
import { useAuthState } from './authStore';
import config from '../../public/config/config';
import { uuidv4 } from '@/common';
import { startFetchStatusLoop } from '@/store/statusStore';
import { uniqBy } from 'lodash';
import { useScrollActions } from './scrollStore';
import { myYggdrasilAddress } from '@/store/authStore';

const state = reactive<chatstate>({
    chats: [],
    chatRequests: [],
});

export const selectedId = ref('');

const retrievechats = async () => {
    await axios
        .get(`${config.baseUrl}api/chats`)
        .then(response => {
            const incommingchats = response.data;

            // debugger
            incommingchats.forEach(chat => {
                addChat(chat);
            });
            sortChats();
        });
};

const addChat = (chat: Chat) => {
    if (!chat.isGroup) {
        const { user } = useAuthState();
        const otherContact: Contact = <Contact>(
            chat.contacts.find(c => c.id !== user.id)
        );
        if (otherContact) {
            startFetchStatusLoop(otherContact);
        }
    }

    if (chat.acceptedChat) {
        state.chats.push(chat);
        state.chats = uniqBy(state.chats, c => c.chatId);
    } else {
        state.chatRequests.push(chat);
    }
    sortChats();
};

export const removeChat = chatId => {
    state.chats = state.chats.filter(c => c.chatId !== chatId);
    sortChats();
    selectedId.value = <string>state.chats.find(() => true)?.chatId;
};

const addGroupchat = (name: string, contacts: Contact[]) => {
    const { user } = useAuthState();
    const newGroupchat: GroupChat = {
        isGroup: true,
        chatId: uuidv4(),
        contacts: contacts,
        messages: [
            {
                from: user.id,
                to: name,
                body: {
                    message: `${user.id} has created and invited you to ${name}`,
                } as SystemBody,
                timeStamp: new Date(),
                id: uuidv4(),
                type: MessageTypes.SYSTEM,
                replies: [],
                subject: null,
            },
        ],
        name: name,
        adminId: user.id,
        read: {},
        acceptedChat: true,
    };
    axios
        .put(`${config.baseUrl}api/group`, newGroupchat)
        .then(res => {
            console.log(res);
        })
        .catch(e => {
            console.log('failed to add groupchat', e);
        });
};

const acceptChat = id => {
    axios
        .post(`${config.baseUrl}api/chats?id=${id}`)
        .then(() => {
            const index = state.chatRequests.findIndex(c => c.chatId == id);
            state.chatRequests[index].acceptedChat = true;
            addChat(state.chatRequests[index]);
            const { user } = useAuthState();
            sendSystemMessage(id, `${user.id} accepted invitation`);
            state.chatRequests.splice(index, 1);
        })
        .catch(error => {
            console.log('Got an error: ', error);
        });
};

const updateChat = (chat: Chat) => {
    removeChat(chat.chatId);
    addChat(chat);
};

function getMessage(chat: Chat, id) {
    let message = chat.messages.find(m => m.id === id);

    if (!message) {
        chat.messages.find(m => {
            const found = m.replies.find(r => r.id === id);
            if (!found) {
                return false;
            }

            message = found;
            return true;
        });
    }

    return message;
}

const addMessage = (chatId, message) => {
    if (message.type === 'READ') {
        const chat: Chat = state.chats.find(chat => chat.chatId == chatId);

        const newRead = getMessage(chat, message.body);
        const oldRead = getMessage(chat, <string>message.from);

        if (
            oldRead &&
            new Date(newRead.timeStamp).getTime() >
                new Date(oldRead.timeStamp).getTime()
        ) {
            return;
        }

        chat.read = { ...chat.read, [<string>message.from]: message.body };
        return;
    }

    if (message.type === 'REMOVEUSER' || message.type === 'ADDUSER') {
        return;
    }

    const chat: Chat = state.chats.find(chat => chat.chatId == chatId);

    if (message.subject) {
        const subjectMessageIndex = chat.messages.findIndex(
            m => m.id === message.subject
        );
        const subjectMessage = chat.messages[subjectMessageIndex];
        subjectMessage.replies = [...subjectMessage.replies, message];
        chat.messages[subjectMessageIndex] = subjectMessage;
        setLastMessage(chatId, message);
        return;
    }

    const index = chat.messages.findIndex(mes => mes.id == message.id);
    if (index !== -1) {
        chat.messages[index] = message;
        return;
    }

    chat.messages.push(message);

    sortChats();
    setLastMessage(chatId, message);

    const { addScrollEvent } = useScrollActions();
    addScrollEvent();
};

const sendMessage = (chatId, message, type: string = 'STRING') => {
    const { sendSocketMessage } = useSocketActions();
    const { user } = useAuthState();
    const msg: Message<String> = {
        id: uuidv4(),
        body: message,
        from: user.id,
        to: chatId,
        timeStamp: new Date(),
        type: type,
        replies: [],
        subject: null,
    };
    addMessage(chatId, msg);
    sendSocketMessage(chatId, msg);
};

const sendSystemMessage = (chatId, message: string) => {
    sendMessage(
        chatId,
        { message: message } as SystemBody,
        MessageTypes.SYSTEM
    );
};

const sendMessageObject = (chatId, message: Message<MessageBodyType>) => {
    const { sendSocketMessage } = useSocketActions();
    // console.log(chatId, message);
    // @TODO when doing add message on SYSTEM/groupupdate results in  max call stack exeeded
    if (message.type !== 'SYSTEM') {
        addMessage(chatId, message);
    }
    let isEdit = false;
    if (message.type === 'EDIT' || message.type === 'DELETE') {
        isEdit = true;
    }

    sendSocketMessage(chatId, message, isEdit);
};

const sendFile = async (chatId, selectedFile, isBlob = false) => {
    const { user } = useAuthState();
    const id = uuidv4();
    var formData = new FormData();
    if (!isBlob) {
        formData.append('file', selectedFile);
    } else {
        formData.append('file', selectedFile, `recording-${Date.now()}.WebM`);
    }

    const msgToSend: Message<Object> = {
        id,
        body: 'Uploading file in progress ...',
        from: user.id,
        to: chatId,
        timeStamp: new Date(),
        type: 'FILE_UPLOAD',
        replies: [],
        subject: null,
    };

    addMessage(chatId, msgToSend);

    try {
        await axios.post(
            `${config.baseUrl}api/files/${chatId}/${id}`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        console.log('File uploaded.');
    } catch (e) {
        msgToSend.body = `Failed to send file: ${e.message}`;
        addMessage(chatId, msgToSend);
        console.log(e);
    }
};

const setLastMessage = (chatId: string, message: Message<String>) => {
    if (!state.chats) return;
    const chat = state.chats.find(c => c.chatId == chatId);
    if (!chat) return;

    sortChats();
};

const sortChats = () => {
    state.chats.sort((a, b) => {
        var adate = a.messages[a.messages.length - 1]
            ? a.messages[a.messages.length - 1].timeStamp
            : new Date(-8640000000000000);
        var bdate = b.messages[b.messages.length - 1]
            ? b.messages[b.messages.length - 1].timeStamp
            : new Date(-8640000000000000);
        return moment(bdate).unix() - moment(adate).unix();
    });
};

const readMessage = (chatId, messageId) => {
    const { user } = useAuthState();

    const newMessage: Message<string> = {
        id: uuidv4(),
        from: user.id,
        to: chatId,
        body: messageId,
        timeStamp: new Date(),
        type: 'READ',
        replies: [],
        subject: null,
    };
    sendMessageObject(chatId, newMessage);
};

const updateContactsInGroup = async (
    groupId,
    contact: Contact,
    remove: boolean
) => {
    const { user } = useAuthState();
    const myLocation = await myYggdrasilAddress();
    const message: Message<GroupManagementBody> = {
        id: uuidv4(),
        from: user.id,
        to: groupId,
        body: {
            type: remove
                ? SystemMessageTypes.REMOVE_USER
                : SystemMessageTypes.ADD_USER,
            message: `${contact.id} has been ${
                remove ? 'removed from' : 'added to'
            } the group`,
            adminLocation: myLocation,
            contact
        },
        timeStamp: new Date(),
        type: MessageTypes.SYSTEM,
        replies: [],
        subject: null,
    };

    sendMessageObject(groupId, message);
};

export const usechatsState = () => {
    return {
        ...toRefs(state),
    };
};

export const usechatsActions = () => {
    return {
        addChat,
        retrievechats,
        sendMessage,
        addMessage,
        sendFile,
        sendMessageObject,
        addGroupchat,
        readMessage,
        acceptChat,
        updateContactsInGroup,
        updateChat
    };
};

interface chatstate {
    chats: Chat[];
    chatRequests: Chat[];
}

export const handleRead = (message: Message<string>) => {
    const { user } = useAuthState();

    let chatId = message.to === user.id ? message.from : message.to;

    const { chats } = usechatsState();
    const chat = chats.value.find(c => c.chatId == chatId);

    const newRead = getMessage(chat, message.body);
    const oldRead = getMessage(chat, <string>message.from);

    if (
        oldRead &&
        new Date(newRead.timeStamp).getTime() <
            new Date(oldRead.timeStamp).getTime()
    ) {
        return;
    }

    chat.read[<string>message.from] = message.body;
};
