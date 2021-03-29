<template>
    <div
        class="flex flex-row"
        :class="{
            'mb-2': isLastMessage,
        }"
    >
        <AvatarImg
            small
            class="mr-2 "
            :class="{
                'opacity-0': !isLastMessage,
            }"
            :id="message.from"
            :showOnlineStatus="false"
        />
        <div class="flex-1">
            <div class="card flex flex-row flex-wrap">
                <div
                    class="flex rounded-md rounded-r-xl mb-1 bg-white shadow relative overflow-hidden"
                    :class="{
                        'my-message': message.from === user?.id,
                        'rounded-tl-xl': isFirstMessage,
                        'rounded-bl-xl': isLastMessage,
                    }"
                >
                    <main
                        class="msgcard flex justify-between"
                        :class="{
                            'flex-row-reverse': message.user === user?.id,
                        }"
                    >
                        <MessageContent :message="message"></MessageContent>
                    </main>

                    <div
                        class="h-7 flex items-center absolute right-1.5 bottom-0"
                        v-if="message.from === user?.id"
                    >
                        <i
                            class="fas fa-check-double text-accent"
                            v-if="isread"
                        ></i>
                        <i class="fas fa-check text-gray-400" v-else></i>
                    </div>
                </div>

                <div
                    style="margin-top: auto;"
                    class="actions pl-4 flex h-7 items-center mb-1"
                >
                    <span
                        class="reply text-xs pr-4"
                        @click="toggleSendReplyMessage(message)"
                    >
                        <i class="fa fa-reply"></i>
                        <span class="text-gray-600"> Reply</span>
                    </span>
                    <div class="pr-4 text-gray-600 date inline-block text-xs">
                        {{ moment(message.timeStamp).fromNow() }}
                        <!-- {{ message }} -->
                    </div>
                </div>
            </div>

            <div
                class="flex flex-col mb-4"
                :class="{
                    'mr-4 border-r-2 pr-2': message.user === user?.id,
                    'ml-4 border-l-2 pl-2': message.user !== user?.id,
                }"
                v-if="message.replies?.length > 0"
            >
                <div
                    class="text-gray-400"
                    :class="{
                        'self-end': message.user === user?.id,
                        'self-start': message.user !== user?.id,
                    }"
                >
                    Replies:
                </div>
                <div
                    v-for="reply in message.replies"
                    :key="reply.id"
                    class="card flex"
                    :class="{
                        'ml-auto flex-row-reverse': message.user === user?.id,
                        'mr-auto': message.user !== user?.id,
                    }"
                >
                    <AvatarImg
                        class="mr-2"
                        small
                        :id="reply.from"
                        :showOnlineStatus="false"
                    />

                    <div
                        class="flex rounded-xl mb-1 overflow-hidden pr-4"
                        :class="{
                            'bg-white': reply.from !== user?.id,
                            'my-message': reply.from === user?.id,
                        }"
                    >
                        <main
                            class="replymsg flex justify-between pt-2 pl-4 pb-2"
                        >
                            <MessageContent :message="reply"></MessageContent>
                        </main>
                    </div>

                    <div
                        style="margin-top: auto;"
                        class="actions pb-4 pl-4 flex"
                    >
                        <div
                            class="pr-4 text-gray-600 date inline-block text-xs"
                        >
                            {{ moment(message.timeStamp).fromNow() }}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts">
    import { defineComponent, onMounted, ref } from 'vue';
    import moment from 'moment';
    import AvatarImg from '@/components/AvatarImg.vue';
    import MessageContent from '@/components/MessageContent.vue';
    import { Message, StringMessageType } from '@/types';
    import { uuidv4 } from '@/common';
    import { useAuthState } from '@/store/authStore';
    import { sendMessageObject, usechatsActions } from '@/store/chatStore';
    import { messageToReplyTo } from '@/services/replyService';
    import { useScrollActions } from '@/store/scrollStore';

    export default defineComponent({
        name: 'MessageCard',
        components: { MessageContent, AvatarImg },
        props: {
            message: Object,
            chatId: String,
            isMine: Boolean,
            isGroup: Boolean,
            isreadbyme: Boolean,
            isread: Boolean,
            isFirstMessage: Boolean,
            isLastMessage: Boolean,
        },
        setup(props) {
            const { user } = useAuthState();

            const toggleEditMessage = () => {
                console.log('toggleEditMessage');
            };

            const editMessage = () => {
                console.log('editMessage');
            };

            const toggleSendForwardMessage = () => {
                console.log('toggleSendForwardMessage');
            };

            const sendForwardMessage = () => {
                console.log('sendQuoteMessage');
            };

            const toggleSendReplyMessage = message => {
                if (
                    messageToReplyTo.value &&
                    messageToReplyTo.value.id === message.id
                ) {
                    messageToReplyTo.value = '';
                    return;
                }
                messageToReplyTo.value = message;
            };

            const sendReplyMessage = () => {
                console.log('sendReplyMessage');

                const { user } = useAuthState();

                const newMessage: Message<StringMessageType> = {
                    id: uuidv4(),
                    from: user.id,
                    to: props.chatId,
                    body: <StringMessageType>null,
                    timeStamp: new Date(),
                    type: 'STRING',
                    replies: [],
                    subject: props.message.id,
                };

                const { sendMessageObject } = usechatsActions();

                sendMessageObject(props.chatId, newMessage);
                messageToReplyTo.value = null;
            };

            const { addScrollEvent } = useScrollActions();

            onMounted(() => {
                addScrollEvent();
            });

            const read = () => {
                const { readMessage } = usechatsActions();
                readMessage(props.chatId, props.message.id);
            };

            if (!props.isreadbyme) {
                console.log('read');
                read();
            }

            const deleteMessage = message => {
                //@todo: show dialog
                const updatedMessage: Message<StringMessageType> = {
                    id: message.id,
                    from: message.from,
                    to: message.chatId,
                    body: 'Message has been deleted',
                    timeStamp: message.timeStamp,
                    type: 'DELETE',
                    replies: [],
                    subject: null,
                };
                sendMessageObject(props.chatId, updatedMessage);
            };

            return {
                moment,
                toggleSendForwardMessage,
                sendReplyMessage,
                toggleSendReplyMessage,
                toggleEditMessage,
                user,
                messageToReplyTo,
                deleteMessage,
            };
        },
    });
</script>
<style lang="css" scoped>
    .text-message * {
        word-wrap: break-word;
        max-width: 100%;
        white-space: pre-wrap;
    }

    .threefold-color {
        background: #44a687;
    }

    .actions {
        visibility: hidden;
    }

    .card:hover > .actions,
    .card:hover > .actions {
        visibility: visible;
    }

    .msgcard,
    .replymsg {
        max-width: 500px;
        word-break: break-word;
    }

    .read {
        height: 28px;
        display: flex;
        align-items: center;
    }

    .my-message {
        background-color: #d0f0c0;
    }
</style>
