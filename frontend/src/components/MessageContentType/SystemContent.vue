<template>
    <div
        v-if="message.body.type === 'JOINED_VIDEOROOM'"
        class="justify-around flex flex-row cursor-pointer"
        @click="joinVideo"
    >
        <div>
            <i class="fas fa-video mr-3"></i>
        </div>
        <i class="underline">{{ message.body.message }}</i>
    </div>
    <div v-else class="justify-around">
        <u
            ><i>{{ message.body.message}}</i></u
        >
    </div>
</template>

<script lang="ts">
    import { popupCenter } from '@/services/popupService';
    import { usechatsActions, usechatsState,} from '@/store/chatStore';
    import { useRoute } from 'vue-router';
    import { computed, defineComponent, ref } from 'vue';
    import { useAuthState } from '@/store/authStore';
    import { MessageTypes, SystemMessageTypes } from '@/types';
    import * as crypto from 'crypto-js'


    export default defineComponent({
        name: 'SystemContent',
        props: {
            message: { type: Object, required: true },
        },
        setup(props) {
            const route = useRoute();
            let selectedId = ref(<string>route.params.id);
            const { chats } = usechatsState();
            const { sendMessage } = usechatsActions();
            const { user } = useAuthState();
            const chat = computed(() => {
                return chats.value.find(c => c.chatId == selectedId.value);
            });
            const joinVideo = () => {
                // @ts-ignore
                const videoRoomId = props.message.body.id ?? crypto.SHA1(chat.value.isGroup
                    ? chat.value.chatId
                    : chat.value.contacts
                        .map(c => c.id)
                        .sort()).toString();

                sendMessage(
                    chat.value.chatId,
                    {
                        type: SystemMessageTypes.JOINED_VIDEOROOM,
                        message: `${user.id} joined the video chat`,
                        id: videoRoomId
                    },
                    MessageTypes.SYSTEM
                );

                popupCenter(`/videoroom/${videoRoomId}`, 'video room', 800, 550);
            }

            return { joinVideo };
        },
    });
</script>
