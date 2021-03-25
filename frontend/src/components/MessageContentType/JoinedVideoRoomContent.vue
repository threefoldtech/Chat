<template>
    <div
        class="justify-around flex flex-row cursor-pointer"
        @click="joinVideo"
    >
        <div>
            <i class="fas fa-video mr-3"></i>
        </div>
        <i class="underline">{{ message.body.message }}</i>
    </div>
</template>

<script lang="ts">
    import { popupCenter } from '@/services/popupService';
    import { usechatsActions, usechatsState,} from '@/store/chatStore';
    import { useRoute } from 'vue-router';
    import { computed, defineComponent, ref } from 'vue';
    import { useAuthState } from '@/store/authStore';
    import { MessageTypes } from '@/types';
    import * as crypto from 'crypto-js'

    export default defineComponent({
        name: 'JoinedVideoRoomContent',
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
                const videoRoomId = props.message.body.id ?? crypto.SHA1(chat.value.isGroup
                    ? chat.value.chatId
                    : chat.value.contacts
                        .map(c => c.id)
                        .sort())

                sendMessage(
                    chat.value.chatId,
                    {
                        message: `${user.id} joined the video chat`,
                        id: videoRoomId
                    },
                    MessageTypes.JOINED_VIDEOROOM
                );

                popupCenter(`/videoroom/${videoRoomId}`, 'video room', 800, 550);
                joinVideoRoom(user.id, chat.id, props.message.body.id)
            }

            return { joinVideo };
        },
    });
</script>

<style scoped></style>
