<template>
    <appLayout>
        <template v-slot:top>
            <div class="w-full flex md:px-4" v-if="chat">
                <div class="place-items-center grid mr-4">
                    <AvatarImg
                        :id="chat.chatId"
                        :showOnlineStatus="false"
                    ></AvatarImg>
                </div>
                <div class="py-4 pl-2">
                    <p class="font-bold font overflow-hidden overflow-ellipsis">
                        {{ chat.name }}
                    </p>
                    <p class="font-thin" v-if="!chat.isGroup">
                        {{
                            statusList[chat.chatId]?.isOnline
                                ? 'Is online'
                                : 'Is offline'
                        }}
                    </p>
                    <p class="font-thin" v-if="chat.isGroup">Group chat</p>
                </div>
            </div>
            <div v-else>Loading</div>
        </template>

        <template v-slot:actions>
            <div class="">
                <div class="relative">
                    <button
                        class="text-lg text-white md:hidden"
                        @click="showMenu = true"
                    >
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    <div
                        class="backdrop"
                        v-if="showMenu"
                        @click="showMenu = false"
                    ></div>
                    <div
                        class="right-2 z-20 -top-2 flex flex-col bg-white shadow-sm w-40 rounded absolute py-2 pl-2"
                        v-if="showMenu"
                    >
                        <button @click="popupMeeting" class="flex align-center">
                            <div class="w-8 justify-center align-center">
                                <i class="fas fa-video"></i>
                            </div>
                            <span class="ml-1 text-left">Call</span>
                        </button>

                        <button @click="null" class="flex">
                            <div class="w-8">
                                <i class="fas fa-info-circle"></i>
                            </div>
                            <span class="ml-1 text-left">Info</span>
                        </button>

                        <button @click="blockChat" class="flex">
                            <div class="w-8">
                                <i class="fas fa-minus-circle"></i>
                            </div>
                            <span class="ml-1 text-left">Block chat</span>
                        </button>
                        <button @click="deleteChat" class="flex">
                            <div class="w-8">
                                <i class="fas fa-trash"></i>
                            </div>
                            <span class="ml-1 text-left">Delete chat</span>
                        </button>
                    </div>
                </div>
            </div>
        </template>

        <template v-slot:default>
            <div
                class="grid grid-cols-1  relative h-full w-full"
                v-if="chat"
                :key="chat.id + selectedId"
                :class="{
                    'md:singleGrid': showSideBar,
                    'md:twoGrid': !showSideBar,
                }"
            >
                <div
                    class="hidden md:block relative h-full flex-col overflow-y-auto"
                >
                    <ChatList />
                </div>
                <div class="relative h-full flex flex-col">
                    <MessageBox :chat="chat" @scrollToBottom="scrollToBottom">
                        <template v-slot:viewAnchor>
                            <div
                                id="viewAnchor"
                                ref="viewAnchor"
                                style="
                                    height: 40vh;
                                    position: absolute;
                                    bottom: 0;
                                    width: 50%;
                                    pointer-events: none;
                                "
                            ></div>
                        </template>
                    </MessageBox>
                    <div
                        v-if="messageToReplyTo"
                        class="flex justify-between m-2 p-4 bg-white rounded-xl"
                    >
                        <div>
                            <b>Replying: </b>
                            <div class="replymsg">
                                <span>{{ messageToReplyTo.from }}</span>
                                <p>{{ messageToReplyTo.body }}</p>
                            </div>
                        </div>

                        <button @click="messageToReplyTo = null">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <ChatInput
                        :selectedid="chat.chatId"
                        @messageSend="scrollToBottom(true)"
                    />
                    <jdialog v-model="showDialog" noActions class="max-w-10">
                        <template v-slot:title class="center">
                            <h1 class="text-center">Blocking</h1>
                        </template>
                        <div>
                            Do you really want to block
                            <b> {{ chat.name }} </b>?
                        </div>
                        <div class="grid grid-cols-2 mt-2">
                            <button
                                @click="doBlockChat"
                                class="bg-red-500 p-2 text-white font-bold"
                            >
                                YES
                            </button>
                            <button @click="showDialog = false" class="p-2">
                                NO
                            </button>
                        </div>
                    </jdialog>
                </div>
                <aside
                    class="hidden relative h-full flex-col overflow-y-auto"
                    :class="{
                        'md:flex': showSideBar,
                        'md:hidden': !showSideBar,
                    }"
                >
                    <div class="absolute max-w-full w-full p-4 pt-8">
                        <div
                            class="bg-white p-2 pb-6 w-full relative rounded-lg mb-4 mt-0 md:grid place-items-center grid-cols-1 md:px-4"
                        >
                            <div class="place-items-center grid relative">
                                <AvatarImg
                                    class="-mt-7"
                                    :id="chat.chatId"
                                    :showOnlineStatus="!chat.isGroup"
                                />
                            </div>
                            <h2
                                class="my-3 break-words text-center w-full overflow-y-auto max-h-28 text-xl"
                            >
                                {{ chat.name }}
                            </h2>
                            <p
                                class="break-words w-full overflow-y-auto font-bold text-center text-gray-300"
                                v-if="!chat.isGroup"
                            >
                                {{ status?.status || 'No status found' }}
                            </p>
                        </div>
                        <group-management
                            :group-chat="chat"
                            @app-call="popupMeeting"
                            @app-block="blockChat"
                            @app-delete="deleteChat"
                        ></group-management>
                    </div>
                </aside>
            </div>

            <div class="grid h-full w-full place-items-center" v-else>
                <h2>Loading</h2>
            </div>
        </template>
    </appLayout>
</template>

<script lang="ts">
    import { useScrollState } from '@/store/scrollStore';

    import appLayout from '../../layout/AppLayout.vue';
    import moment from 'moment';
    import {
        defineComponent,
        onMounted,
        watch,
        ref,
        toRefs,
        nextTick,
        computed,
        onBeforeMount,
        onUpdated,
    } from 'vue';

    import { each } from 'lodash';
    import { statusList } from '@/store/statusStore';
    import { usechatsState, usechatsActions } from '@/store/chatStore';
    import { sendBlockChat, sendRemoveChat } from '@/store/socketStore';
    import { useAuthState } from '@/store/authStore';
    import { popupCenter } from '@/services/popupService';
    import MessageCard from '@/components/MessageCard.vue';
    import ChatList from '@/components/ChatList.vue';
    import ChatInput from '@/components/ChatInput.vue';
    import AvatarImg from '@/components/AvatarImg.vue';
    import GroupManagement from '@/components/GroupManagement.vue';
    import Dialog from '@/components/Dialog.vue';
    import * as crypto from 'crypto-js';
    import { useIntersectionObserver } from '@/lib/intersectionObserver';
    import { useRoute, useRouter } from 'vue-router';
    import { messageToReplyTo } from '@/services/replyService';
    import { showSideBar } from '@/services/sidebarService';
    import {
        JoinedVideoRoomBody,
        MessageTypes,
        SystemMessageTypes,
    } from '@/types';
    import MessageBox from '@/components/MessageBox.vue';
    import { messageBox } from '@/services/messageHelperService';

    export default defineComponent({
        name: 'ChatView',
        components: {
            MessageBox,
            AvatarImg,
            ChatInput,
            MessageCard,
            jdialog: Dialog,
            appLayout,
            GroupManagement,
            ChatList,
        },
        setup(props) {
            const route = useRoute();
            let selectedId = ref(<string>route.params.id);
            watch(
                () => route.params.id,
                id => {
                    selectedId.value = <string>id;
                }
            );

            const { retrievechats } = usechatsActions();
            onBeforeMount(retrievechats);

            const { chats } = usechatsState();
            const { sendMessage } = usechatsActions();
            const { user } = useAuthState();
            const m = val => moment(val);
            const showMenu = ref(false);
            const file = ref();
            let showDialog = ref(false);

            const propRefs = toRefs(props);
            const truncate = (value, limit = 20) => {
                if (value.length > limit) {
                    value = value.substring(0, limit - 3) + '...';
                }
                return value;
            };

            const getMessagesSortedByUser = computed(() => {
                let chatBlockIndex = 0;

                return chat.value.messages.reduce((acc: any, message) => {
                    if (
                        acc[chatBlockIndex] &&
                        acc[chatBlockIndex].user === <string>message.from
                    ) {
                        acc[chatBlockIndex].messages.push(message);
                        return acc;
                    } else {
                        chatBlockIndex++;
                    }

                    acc[chatBlockIndex] = {
                        user: <string>message.from,
                        messages: [],
                    };
                    acc[chatBlockIndex].messages.push(message);

                    return acc;
                }, {});
            });

            const message = ref('');

            const chat = computed(() => {
                return chats.value.find(c => c.chatId == selectedId.value);
            });

            const popupMeeting = () => {
                // @ts-ignore
                // const str = chat?.contacts ? chat.id : [user.id, chat.id].sort().join();
                const str: string = chat.value.isGroup
                    ? chat.value.chatId
                    : chat.value.contacts
                          .map(c => c.id)
                          .sort()
                          .join();

                const id = crypto.SHA1(str);
                sendMessage(
                    chat.value.chatId,
                    {
                        type: SystemMessageTypes.JOINED_VIDEOROOM,
                        message: `${user.id} joined the video chat`,
                        id: id.toString(),
                    } as JoinedVideoRoomBody,
                    MessageTypes.SYSTEM
                );

                popupCenter(`/videoroom/${id}`, 'video room', 800, 550);
            };

            const deleteChat = () => {
                sendRemoveChat(chat.value.chatId);
                const router = useRouter();
                // router is undefined?
                // router.push({ name: 'chat' });
                window.location.href = '/chat';
            };

            const blockChat = () => {
                showDialog.value = true;
            };
            const doBlockChat = () => {
                showDialog.value = false;
                sendBlockChat(chat.value.chatId);
            };

            const reads = computed(() => {
                const preReads = {};
                each(chat.value.read, (val: string, key: string) => {
                    if (key === user.id) {
                        return;
                    }
                    preReads[val] = preReads[val]
                        ? [key, ...preReads[val]]
                        : [key];
                });
                return preReads;
            });

            const viewAnchor = ref(null);

            const { isIntersecting } = useIntersectionObserver(viewAnchor);

            const scrollToBottom = (force = false) => {
                console.log('scroll');
                if (!force && !isIntersecting.value) {
                    return;
                }

                nextTick(() => {
                    if (!messageBox.value) {
                        return;
                    }

                    messageBox.value.scrollTo(0, messageBox.value.scrollHeight);
                });
            };

            onMounted(() => {
                nextTick(() => {
                    scrollToBottom(true);
                });
            });

            onUpdated(() => {
                nextTick(() => {
                    scrollToBottom(true);
                });
            });

            const status = computed(() => {
                return statusList[selectedId.value];
            });

            const { scrollEvents } = useScrollState();

            watch(scrollEvents, () => {
                nextTick(() => {
                    scrollToBottom(true);
                });
            });

            onMounted(() => {
                nextTick(() => {
                    scrollToBottom(true);
                });
            });

            return {
                chats,
                selectedId,
                chat,
                getMessagesSortedByUser,
                truncate,
                message,
                file,
                m,
                messageBox,
                scrollToBottom,
                status,
                statusList,
                popupMeeting,
                deleteChat,
                blockChat,
                doBlockChat,
                viewAnchor,
                reads,
                showDialog,
                showMenu,
                messageToReplyTo,
                showSideBar,
                moment,
                ...propRefs,
            };
        },
    });
</script>

<style scoped type="text/css">
    @tailwind base;
    @tailwind components;
    @tailwind utilities;

    @layer utilities {
        @variants responsive {
            .singleGrid {
                grid-template-columns: 400px 1fr 400px;
            }

            .twoGrid {
                grid-template-columns: 400px 1fr;
            }
        }
    }

    .replymsg {
        max-width: 750px;
        word-break: break-word;
    }
</style>
