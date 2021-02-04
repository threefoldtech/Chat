import { reactive } from "@vue/reactivity";
import { toRefs } from "vue";
import axios from "axios";
import moment from "moment";
import { Chat, Message } from "../types";
import {useSocketActions} from './socketStore'
import { useAuthState } from "./authStore";
import {useContactsActions} from './contactStore'
import config from '../../public/config/config'
import { uuidv4 } from "@/common";

const state = reactive<chatstate>({
    chats:[]
});

const retrievechats = async () => {
    const response = await axios.get(`${config.baseUrl}api/chats`).then((response) => {
        console.log("retreived chats: ", response.data)
        const incommingchats = response.data

        // debugger
        incommingchats.forEach(chat => {
            addChat(chat)
        })
        sortChats()
    })
}

const addChat = (chat:Chat) => {
    state.chats.push(chat)
    sortChats()
}

const addMessage = (chatId, message) => {
    console.log('in addmessage chatid', chatId)
    console.log('in addmessage message', message)

    const chat:Chat = state.chats.find(chat=>chat.chatId == chatId)
    chat.messages.push(message)
    console.log("before setLastmessage")
    setLastMessage(chatId, message)
    console.log(state.chats)
}

const sendMessage = (chatId, message) => {
    const {sendSocketMessage} = useSocketActions()
    const {user} = useAuthState()
    const msg:Message<String> = {
        id: uuidv4(),
        body: message,
        from: user.id,
        to: chatId,
        timeStamp: new Date(),
        type: "STRING"
    }
    addMessage(chatId, msg)
    sendSocketMessage(chatId, msg)
}

const sendFile = async (chatId, file) => {
    const { sendSocketMessage } = useSocketActions()
    const {user} = useAuthState()
    console.log("heree ",file, chatId)
    const parsedFile = await file.arrayBuffer()
    // const a = { 
    //     chatId,
    //     file: {
    //     name: file.name, 
    //     type: file.type, 
    //     size: file.size, 
    //     data: parsedFile 
    //     }
    // }

    const msg:Message<Object> = {
        id: uuidv4(),
        body: {
            name: file.name,
            parsedFile
        },
        from: user.id,
        to: chatId,
        timeStamp: new Date(),
        type: "FILE_UPLOAD"
    }
    sendSocketMessage(chatId,msg)
    
    // const msg:Message<> = {
    //     id: uuidv4(),
    //     body: message,
    //     from: user.id,
    //     to: chatId,
    //     timeStamp: new Date(),
    //     type: "FILE"
    // }
    // addMessage(chatId, msg)
    // sendSocketMessage(chatId, msg)
}

const setLastMessage= (chatId:string, message:Message<String>) => {
    console.log("here", state.chats, chatId)
    if(!state.chats) return
    const chat = state.chats.find(c=> c.chatId == chatId)
    if(!chat) return

    // sortChats()
}

const sortChats = () => {
    state.chats.sort((a,b)=> {
        var adate = a.messages[a.messages.length-1] ? a.messages[a.messages.length-1].timeStamp : new Date(-8640000000000000)
        var bdate = b.messages[b.messages.length-1]? b.messages[b.messages.length-1].timeStamp : new Date(-8640000000000000)
        return moment(bdate).unix() - moment(adate).unix()
    })
}

export const usechatsState = () => {
    return {
        ...toRefs(state),
    }
}

export const usechatsActions = () => {
    return {
        addChat,
        retrievechats,
        sendMessage,
        addMessage,
        sendFile
    }
}

interface chatstate {
    chats: Chat[]
}
