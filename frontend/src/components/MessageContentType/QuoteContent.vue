<template>
    <div class="p-4">
        <div class="bg-gray-200 p-4" v-if="!preventRecursion">
            <MessageContent
                :message="message.body.quotedMessage"
                preventRecursion
            >
            </MessageContent>
        </div>
        <div>{{ message.body.message }}</div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import Button from '@/components/Button.vue';
    import AvatarImg from '@/components/AvatarImg.vue';
    import MessageContent from '@/components/MessageContent.vue';

    export default defineComponent({
        name: 'QuoteContent',
        components: { MessageContent, AvatarImg, Button },
        props: {
            message: { type: Object, required: true },
            preventRecursion: {
                type: Boolean,
                default: false,
                required: false,
            },
        },
    });
</script>
