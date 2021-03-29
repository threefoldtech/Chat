<template>
    <div
        class="chatcard relative grid grid-cols-12 mb-2 py-2 text-sm"
        :class="{
            'bg-gray-50': !router.currentRoute?.value.path.includes(chat.name),
            'bg-gray-200': router.currentRoute?.value.path.includes(chat.name),
        }"
    >
        <div class="col-span-2 place-items-center grid relative">
            <span
                v-if="unreadMessagesAmount > 0"
                class="absolute right-2 -top-2 px-1 bg-accent rounded-full text-xs z-10"
            >
                {{ unreadMessagesAmount }}
            </span>
            <AvatarImg :id="chat.chatId" :showOnlineStatus="!chat.isGroup" />
        </div>
        <div class="col-span-10 px-2">
            <p class="flex place-content-between">
                <span
                    class="font-bold break-normal overflow-ellipsis overflow-hidden"
                >
                    {{ chat.name }}
                </span>
                <span class="font-thin" v-if="chat.isGroup"> group</span>
                <span class="font-thin" v-if="lastMessage">
                    {{ timeAgo(lastMessage.timeStamp) }}
                </span>
            </p>
            <p class="col-end-13 col-span-2 font-thin truncate">
                {{ lastMessageBody }}
            </p>
        </div>
    </div>
</template>

<script lang="ts">
    import { computed, defineComponent, ref } from 'vue';
    import { findLastIndex } from 'lodash';
    import { useAuthState } from '@/store/authStore';
    import {
        Message,
        MessageBodyType,
        MessageTypes,
        SystemBody,
    } from '@/types';
    import moment from 'moment';
    import { statusList } from '@/store/statusStore';
    import AvatarImg from '@/components/AvatarImg.vue';
    import { useRouter } from 'vue-router';

    export default defineComponent({
        name: 'ChatCard',
        components: { AvatarImg },
        props: {
            chat: Object,
        },
        setup(props) {
            const { user } = useAuthState();

            const lastReadByMe = computed(() => {
                let lastReadMessage = props.chat.read[<string>user.id];
                return findLastIndex(
                    props.chat.messages,
                    (message: Message<MessageBodyType>) =>
                        lastReadMessage === message.id
                );
            });
            const lastMessage = computed(() => {
                return props.chat &&
                    props.chat.messages &&
                    props.chat.messages.length
                    ? props.chat.messages[props.chat.messages.length - 1]
                    : 'No messages yet';
            });
            const newMessages = computed(() => {
                return props.chat.messages.length - lastReadByMe.value - 1;
            });
            const timeAgo = time => {
                return moment(time).fromNow();
            };

            const status = computed(() => {
                return statusList[props.chat.chatId];
            });

            const router = useRouter();
            const currentRoute = computed(() => router.currentRoute.value);

            const lastMessageBody = computed(() => {
                const lstmsg = lastMessage.value;
                switch (lstmsg.type) {
                    case 'GIF':
                        return 'Gif was sent';
                    case 'QUOTE':
                        return lstmsg.body.message;
                    case MessageTypes.SYSTEM:
                        return (lstmsg.body as SystemBody).message;
                    case 'FILE':
                        return 'File has been uploaded';
                    case 'DELETE':
                    default:
                        return lstmsg.body;
                }
            });

            const unreadMessagesAmount = computed(() => {
                if (!props.chat || !user) {
                    return 0;
                }

                const lastReadMessageId = props.chat.read[<string>user.id];
                const index = props.chat.messages?.findIndex(
                    m => m.id === lastReadMessageId
                );
                if (!index || index < 1) {
                    return 0;
                }

                return props.chat.messages.length - (index + 1);
            });

            return {
                status,
                newMessages,
                lastReadByMe,
                lastMessage,
                lastMessageBody,
                timeAgo,
                router,
                user,
                currentRoute,
                unreadMessagesAmount,
            };
        },
    });
</script>

<style scoped>
    .chatcard {
    }
    .chatcard:hover {
        background-color: lightgray;
    }
</style>
