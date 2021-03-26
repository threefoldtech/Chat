<template>
    <!--    <div-->
    <!--        class="flex flex-col items-start"-->
    <!--        :class="{-->
    <!--            'items-start': messageBlock.user !== user?.id,-->
    <!--            'items-end': messageBlock.user === user?.id,-->
    <!--        }"-->
    <!--    >-->
    <!--        <div class="flex justify-start pt-4 pb-2 w-18 mr-4">-->
    <!--            <AvatarImg :id="messageBlock.user" :showOnlineStatus="false" />-->
    <!--        </div>-->

    <!--        <div v-for="message in messageBlock.messages" :key="message">-->
    <div
        style="position: relative;"
        class="card flex flex-row flex-wrap"
        :class="{
            'flex-row-reverse': message.user === user?.id,
        }"
    >
        <div
            class="flex rounded-xl mb-1 pr-4 border-2"
            :class="{
                'bg-gray-200': message.user === user?.id,
                'bg-white': message.user !== user?.id,
                'border-black': messageToReplyTo?.id === message?.id,
            }"
        >
            <main
                class="msgcard flex justify-between pt-2 pl-4 pb-2"
                :class="{
                    'flex-row-reverse': message.user === user?.id,
                }"
            >
                <MessageContent :message="message"></MessageContent>
            </main>
        </div>

        <div
            style="margin-top: auto;"
            class="actions pb-4 pl-4 flex"
            :class="{
                'flex-row-reverse': message.user === user?.id,
            }"
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
                :class="{
                    'ml-4': message.user === user?.id,
                    'mr-4': message.user !== user?.id,
                }"
                :id="reply.from"
                :showOnlineStatus="false"
            />

            <div
                class="flex rounded-xl mb-1 overflow-hidden pr-4"
                :class="{
                    'bg-gray-200': reply.from === user?.id,
                    'bg-white': reply.from !== user?.id,
                }"
            >
                <main
                    class="replymsg flex justify-between pt-2 pl-4 pb-2"
                    :class="{
                        'flex-row-reverse': message.user === user?.id,
                    }"
                >
                    <MessageContent :message="reply"></MessageContent>
                </main>
            </div>

            <div
                style="margin-top: auto;"
                class="actions pb-4 pl-4 flex"
                :class="{
                    'flex-row-reverse': message.user === user?.id,
                }"
            >
                <div class="pr-4 text-gray-600 date inline-block text-xs">
                    {{ moment(message.timeStamp).fromNow() }}
                </div>
            </div>
        </div>
    </div>
    <!--        </div>-->
    <!--    </div>-->
</template>

<script lang="ts">
    import { defineComponent, onMounted, ref } from 'vue';
    import moment from 'moment';
    import AvatarImg from '@/components/AvatarImg.vue';
    import MessageContent from '@/components/MessageContent.vue';
    import { Message, StringMessageType } from '@/types';
    import { uuidv4 } from '@/common';
    import { useAuthState } from '@/store/authStore';
    import { usechatsActions } from '@/store/chatStore';
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

            // if (!props.isreadbyme) {
            //     console.log('read');
            //     read();
            // }

            return {
                moment,
                toggleSendForwardMessage,
                sendReplyMessage,
                toggleSendReplyMessage,
                toggleEditMessage,
                user,
                messageToReplyTo,
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

    .reply:hover {
        text-decoration: underline;
        cursor: pointer;
    }

    .msgcard,
    .replymsg {
        max-width: 500px;
        word-break: break-word;
    }
</style>
