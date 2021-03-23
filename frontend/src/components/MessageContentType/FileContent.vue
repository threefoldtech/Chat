<template>
    <a
        class="py-2 x-2 bg-gray-200 border-r-2"
        :href="calcExternalResourceLink(message.body.url)"
        download
        >{{ message.body.filename }}</a
    >
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { calcExternalResourceLink } from '@/services/urlService';

    export default defineComponent({
        name: 'FileContent',
        props: {
            message: { type: Object, required: true },
        },
        setup(props) {
            return {
                calcExternalResourceLink,
            };
        },
    });
</script>
