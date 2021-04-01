<template>
    <div class="flex-grow relative overflow-y-auto" ref="messageBox">
        <div class="absolute w-full mt-8 px-4">
            <div v-for="(message, i) in chat.messages">
                <div
                    v-if="showDivider(chat, i)"
                    class="grey--text text-sm text-center p-4"
                >
                    {{ moment(message.timeStamp).calendar() }}
                </div>

                <MessageCard
                    :isread="i <= lastRead"
                    :isreadbyme="i <= lastReadByMe"
                    :message="message"
                    :chatId="chat.chatId"
                    :isGroup="chat.isGroup"
                    :isMine="message.from === user.id"
                    :isLastMessage="isLastMessage(chat, i)"
                    :isFirstMessage="isFirstMessage(chat, i)"
                    v-on:scroll="$emit('scrollToBottom')"
                    :key="`${message.id}-${i <= lastRead}`"
                />
            </div>

            <slot name="viewAnchor" />
        </div>
    </div>
</template>
<script lang="ts">
    import MessageCard from '@/components/MessageCard.vue';
    import { useAuthState } from '@/store/authStore';
    import moment from 'moment';
    import { computed, Ref } from 'vue';
    import { findLastIndex } from 'lodash';
    import {
        isFirstMessage,
        isLastMessage,
        showDivider,
        messageBox,
    } from '@/services/messageHelperService';
    import { Chat, Message, MessageBodyType } from '@/types';

    export default {
        name: 'MessageBox',
        components: { MessageCard },
        props: {
            chat: {},
        },
        setup(props: { chat: Chat }) {
            const lastRead = computed(() => {
                let id = <string>user.id;
                //@ts-ignore
                const { [id]: _, ...read } = props.chat.read;

                const reads = Object.values(read);

                return findLastIndex(props.chat.messages, message =>
                    reads.includes(<string>message.id)
                );
            });

            const lastReadByMe = computed(() => {
                return findLastIndex(
                    props.chat.messages,
                    message => props.chat.read[<string>user.id] === message.id
                );
            });

            const { user } = useAuthState();
            return {
                isLastMessage,
                isFirstMessage,
                user,
                moment,
                lastRead,
                lastReadByMe,
                showDivider,
                messageBox,
            };
        },
    };
</script>
<style scoped type="text/css">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer utilities {
        @variants responsive {
        }
    }
</style>
