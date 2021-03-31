<template>
    <div>
        <div class="bg-gray-200 p-4 border-l-4" v-if="!preventRecursion">
            <MessageContent
                :message="message.body.quotedMessage"
                preventRecursion
            ></MessageContent>
        </div>
        <div>{{ message.body.message }}</div>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import MessageContent from '../MessageContent.vue';

    export default defineComponent({
        name: 'QuoteContent',
        components: { MessageContent },
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
