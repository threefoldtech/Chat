<template>
    <section class="h-full bg-white">
        <div class="relative w-full px-2 pt-4">
            <div
                class="chatcard relative mb-2 py-2 cursor-pointer flex items-center"
            >
                <button
                    @click="showAddUserDialog = true"
                    class="bg-icon colro rounded-full text-white"
                >
                    <i class="fas fa-plus"></i>
                </button>
                <h1 style="padding-top: 5px">Messages</h1>
            </div>
            <div v-if="filteredChatRequests.length > 0">
                <h2 style="font-size: 1.5em">
                    You have
                    <span style="">
                        {{ filteredChatRequests.length }}
                    </span>
                    new connection request<span
                        v-if="filteredChatRequests.length > 1"
                        >s</span
                    >
                </h2>
                <ChatRequestList :chat-requests="filteredChatRequests" />
            </div>
            <div
                class="relative overflow-y-auto w-full max-h-full h-full pt-4"
                v-if="filteredChats && filteredChats.length"
            >
                <ChatCard
                    v-for="chat in filteredChats"
                    :key="
                        `${chat.chatId}-${chat.messages.length}-${
                            chat.read[user.id]
                        }`
                    "
                    class="grid grid-cols-12 rounded-lg mb-2 py-2 cursor-pointer"
                    @click="setSelected(chat.chatId)"
                    :chat="chat"
                />
            </div>
        </div>

        <div
            v-if="filteredChatRequests.length == 0 && filteredChats.length == 0"
            class="text-center"
        >
            <p>It feels lonely over here :(</p>
            <button
                @click="sendUpdate(true)"
                class="mt-2 border rounded-full px-4"
            >
                Add a contact
            </button>
        </div>

        <jdialog
            :modelValue="showAddUserDialog"
            @update:modelValue="sendUpdate"
            noActions
        >
            <template v-slot:title>
                <h1>Create a new chat</h1>
            </template>
            <add-contact @closeDialog="sendUpdate(false)"> </add-contact>
        </jdialog>
    </section>
</template>

<script lang="ts">
    import moment from 'moment';
    import { useSocketActions } from '@/store/socketStore';
    import { defineComponent, ref, computed, onBeforeMount, inject } from 'vue';
    import { usechatsState, usechatsActions } from '@/store/chatStore';
    import { useAuthState, useAuthActions } from '@/store/authStore';
    import addContact from '@/components/ContactAdd.vue';
    import AvatarImg from '@/components/AvatarImg.vue';
    import ChatRequestList from '@/components/ChatRequestList.vue';
    import Dialog from '@/components/Dialog.vue';
    import ChatCard from '@/components/ChatCard.vue';
    import { startFetchStatusLoop } from '@/store/statusStore';
    import { statusList } from '@/store/statusStore';
    import { uniqBy } from 'lodash';
    import { useRouter } from 'vue-router';
    import { showAddUserDialog } from '@/services/dialogService';
    import { useScrollActions } from '@/store/scrollStore';

    export default defineComponent({
        name: 'Apps',
        props: {
            modelValue: {
                type: Boolean,
                default: false,
            },
        },
        components: {
            addContact,
            jdialog: Dialog,
            ChatCard,
            AvatarImg,
            ChatRequestList,
        },
        emits: ['closeDialog'],
        setup(props, context) {
            const { chats, chatRequests } = usechatsState();
            const { retrievechats } = usechatsActions();

            let selectedId = ref('');

            const status = computed(() => {
                return statusList[selectedId.value];
            });

            const { user } = useAuthState();

            const m = val => moment(val);
            const searchValue = ref('');
            let showContacts = ref(false);

            const router = useRouter();

            const setSelected = id => {
                router.push({ name: 'single', params: { id } });
            };

            const filteredChats = computed(() => {
                if (searchValue.value == '') {
                    return chats.value;
                }
                console.log('filtered', chats.value);
                return chats.value.filter(c =>
                    c.name
                        .toLowerCase()
                        .includes(searchValue.value.toLowerCase())
                );
            });
            onBeforeMount(() => {
                const { initializeSocket } = useSocketActions();
                initializeSocket(user.id.toString());
                retrievechats();
            });

            const selectedChat = computed(() =>
                chats.value.find(chat => chat.chatId == selectedId.value)
            );

            startFetchStatusLoop(user);

            const filteredChatRequests = computed(() => {
                const filteredChats = chatRequests.value.filter(
                    cr => !chats.value.find(c => c.chatId === cr.chatId)
                );

                //@ts-ignore
                return uniqBy(filteredChats, c => c.chatId);
            });

            const sendUpdate = newVal => {
                console.log('update it');
                showAddUserDialog.value = newVal;
            };

            return {
                status,
                selectedId,
                selectedChat,
                setSelected,
                chats,
                filteredChatRequests,
                searchValue,
                filteredChats,
                showContacts,
                user,
                m,
                sendUpdate,
                showAddUserDialog,
            };
        },
    });
</script>
