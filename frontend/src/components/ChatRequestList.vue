<template>
    <div v-for="(chat, i) in chatRequests" :key="i">
        <div class="grid grid-cols-12 w-full rounded-lg mb-2 py-2">
            <span v-if="chat.isGroup" class="truncate col-span-8">
                {{ chat.admin }} invited you to {{ chat.name }}
            </span>
            <span v-else class="truncate col-span-8">
                <b>{{ chat.name }}</b> wants to have a chat
            </span>
            <button class="col-span-4" @click="acceptChatRequest(chat.chatId)">
                Accept Chat
            </button>
        </div>
    </div>
</template>
<script lang="ts">
    import { usechatsActions } from '@/store/chatStore';

    export default {
        name: 'ChatRequestList',
        props: {
            chatRequests: {},
        },
        setup() {
            const acceptChatRequest = id => {
                const { acceptChat } = usechatsActions();
                acceptChat(id);
            };
            return {
                acceptChatRequest,
            };
        },
    };
</script>
