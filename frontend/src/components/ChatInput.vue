<template>
    <GifSelector
        v-if="showGif"
        v-on:sendgif="sendGif"
        style="z-index: 10000"
        v-on:close="hideGif"
    />
    <div
        class="md:p-2 md:m-2 md:rounded-3xl bg-white flex flex-col actions md:flex-row"
        @paste="onPaste"
    >
        <div
            class="md:col-span-4 flex flex-nowrap md:bg-transparent bg-gray-200"
            :class="{ hidden: !collapsed }"
        >
            <button
                class="action-btn mx-2 my-0 p-0 self-center flex-1 pt-0.5"
                @click="toggleGif"
            >
                <h2>GIF</h2>
            </button>
            <button
                class="action-btn mx-2 my-0 p-0 self-center flex-1"
                @click.stop="selectFile"
            >
                <i
                    class="fas fa-paperclip  transform"
                    style="--tw-rotate: -225deg"
                ></i>
            </button>
            <input
                class="hidden"
                type="file"
                id="fileinput"
                ref="fileinput"
                @change="changeFile"
            />
            <button
                class="action-btn mx-2 my-0 p-0 self-center flex-1"
                @click.stop="startRecording"
                v-if="!stopRecording"
            >
                <i class="fas fa-microphone "></i>
            </button>
            <button
                class="action-btn mx-2 my-0 p-0 self-center flex-1"
                @click.stop="stopRecording"
                v-else
            >
                <i class="fas fa-circle text-red-600"></i>
            </button>

            <span
                ref="emojipicker"
                :class="{ hidden: !showEmoji }"
                style="position: absolute; bottom: 75px; z-index: 10000"
            >
                <unicode-emoji-picker v-pre></unicode-emoji-picker>
            </span>

            <button
                class="action-btn mx-2 my-0 p-0 self-center flex-1"
                @click.stop="toggleEmoji"
                v-if="!file"
            >
                😃
            </button>
        </div>
        <div class="flex flex-row flex-1">
            <button
                class="action-btn mx-2 my-0 p-0 self-center md:hidden"
                @click="collapsed = !collapsed"
                :key="collapsed.toString()"
            >
                <i v-if="collapsed" class="fas fa-chevron-down "></i>
                <i v-else class="fas fa-chevron-up "></i>
            </button>
            <div
                class="bg-indigo-100 inline-flex text-sm rounded flex-row h-8 pl-3 self-center mr-2"
                v-if="file"
            >
                <div class="self-center">
                    <i class="fas fa-file"></i>
                </div>
                <span
                    class="ml-2 mr-1 leading-relaxed truncate max-w- self-center hidden md:inline-block"
                >
                    {{ file.name }}
                </span>
                <button
                    class="action-btn p-2 mx-0 self-center"
                    @click.stop="removeFile"
                >
                    <i class="fas  fa-times"></i>
                </button>
            </div>
            <form class="w-full" @submit.prevent="chatsend">
                <input type="text" ref="message" v-focus />
            </form>
            <button
                class="action-btn mx-2 my-0 p-0 self-center"
                @click="chatsend"
            >
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    </div>
    <div
        class="overlay-emoji"
        :class="{ hidden: !showEmoji }"
        @click="hideEmoji"
        style="
            position: fixed;
            width: 100vw;
            height: 100vh;
            background: transparent;
            top: 0;
            left: 0;
            z-index: 9999;
        "
    ></div>
    <div
        class="overlay-gif"
        :class="{ hidden: !showGif }"
        @click="hideGif"
        style="
            position: fixed;
            width: 100vw;
            height: 100vh;
            background: transparent;
            top: 0;
            left: 0;
            z-index: 9999;
        "
    ></div>
</template>
<script lang="ts">
    import { computed, nextTick, ref, watch } from 'vue';
    import { messageState, usechatsActions } from '@/store/chatStore';
    import GifSelector from '@/components/GifSelector.vue';
    import { subjectMessage } from '@/services/replyService';
    import { useAuthState } from '@/store/authStore';
    import {
        Message,
        MessageBodyType,
        MessageTypes,
        QuoteBodyType,
        StringMessageType,
    } from '@/types';
    import { uuidv4 } from '@/common';
    import { useScrollActions } from '@/store/scrollStore';
    import { EmojiPickerElement } from 'unicode-emoji-picker';

    export default {
        name: 'ChatInput',
        components: {
            GifSelector,
        },
        emits: ['messageSend'],
        props: {
            selectedid: { type: String },
        },
        setup(props, { emit }) {
            // Not actually a vue component but CustomElement ShadowRoot. I know vue doesnt really like it and gives a warning.
            new EmojiPickerElement();

            const { sendMessage, sendFile } = usechatsActions();

            const message = ref(null);
            const messageBox = ref(null);
            const fileinput = ref();
            const file = ref(null);
            const emojipicker = ref();

            const stopRecording = ref(null);
            const showEmoji = ref(false);

            watch(subjectMessage, () => {
                if (subjectMessage.value) {
                    console.log('Selecting chat ...');
                    message.value.focus();
                }
            });

            const { addScrollEvent } = useScrollActions();

            const chatsend = async e => {
                if (subjectMessage.value) {
                    const { user } = useAuthState();

                    const newMessage: Message<QuoteBodyType> = {
                        id: uuidv4(),
                        from: user.id,
                        to: <string>props.selectedid,
                        body: <QuoteBodyType>{
                            message: message.value.value,
                            quotedMessage: <Message<MessageBodyType>>(
                                subjectMessage.value
                            ),
                        },
                        timeStamp: new Date(),
                        type: 'QUOTE',
                        replies: [],
                        subject: null,
                    };

                    const { sendMessageObject } = usechatsActions();

                    sendMessageObject(props.selectedid, newMessage);

                    subjectMessage.value = null;
                    message.value.value = '';

                    addScrollEvent();
                    return;
                }

                if (message.value.value != '') {
                    sendMessage(props.selectedid, message.value.value);
                    message.value.value = '';
                    console.log('MESSAGE: ', message.value.value);
                }
                if (file.value) {
                    sendFile(props.selectedid, file.value);
                    removeFile();
                }
                emit('messageSend');

                showEmoji.value = false;
            };

            const selectFile = () => {
                fileinput.value.click();
            };

            const changeFile = () => {
                file.value = fileinput.value?.files[0];
                message.value.focus();
            };

            const removeFile = () => {
                file.value = null;
            };

            const startRecording = async () => {
                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: true,
                });

                const mediaRecorder = new MediaRecorder(stream);
                const audioChunks = [];

                mediaRecorder.addEventListener('dataavailable', event => {
                    audioChunks.push(event.data);
                });

                mediaRecorder.start();

                stopRecording.value = () => {
                    mediaRecorder.addEventListener('stop', async () => {
                        const audioBlob = new Blob(audioChunks);
                        console.log(props.selectedid);
                        console.log(audioBlob);
                        sendFile(props.selectedid, audioBlob, true);
                        stopRecording.value = null;
                    });

                    mediaRecorder.stop();
                    stream.getAudioTracks().forEach(at => at.stop());
                };
            };
            const toggleEmoji = () => {
                showEmoji.value = !showEmoji.value;
            };
            const hideEmoji = () => {
                if (!showEmoji) {
                    return;
                }
                showEmoji.value = false;
            };

            const showGif = ref(false);
            const toggleGif = () => {
                showGif.value = !showGif.value;
            };
            const sendGif = async gif => {
                showGif.value = false;
                const { sendMessage } = usechatsActions();
                sendMessage(props.selectedid, gif, 'GIF');
                emit('messageSend');
                addScrollEvent();
            };
            const hideGif = async gif => {
                showGif.value = false;
            };

            nextTick(() => {
                const emojiPicker = document.querySelector(
                    'unicode-emoji-picker'
                );
                emojiPicker.addEventListener('emoji-pick', event => {
                    message.value.value = `${message.value.value}${event.detail.emoji}`;
                    message.value.focus();
                });
            });

            const onPaste = (e: ClipboardEvent) => {
                if (!e.clipboardData) {
                    return;
                }

                var items = e.clipboardData.items;

                if (!items) {
                    return;
                }

                for (var i = 0; i < items.length; i++) {
                    if (items[i].type.indexOf('image') == -1) {
                        continue;
                    }

                    var pastedImage: File = items[i].getAsFile();
                    file.value = pastedImage;
                    message.value.focus();
                }
            };

            const collapsed = ref(true);
            return {
                sendMessage,
                message,
                chatsend,
                changeFile,
                selectFile,
                fileinput,
                file,
                removeFile,
                startRecording,
                stopRecording,
                showEmoji,
                toggleEmoji,
                hideEmoji,
                emojipicker,
                showGif,
                toggleGif,
                sendGif,
                hideGif,
                collapsed,
                onPaste,
            };
        },
    };
</script>

<style scoped>
    .action-btn:hover {
        color: rgb(68, 166, 135);
    }

    .action-btn {
    }

    .actions {
        min-height: 3em;
    }
</style>
