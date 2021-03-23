<template>
    <img
        width="450"
        :src="calcExternalResourceLink(message.body.url)"
        @load="imageLoaded"
    />
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { calcExternalResourceLink } from '@/services/urlService';
    import { useScrollActions, useScrollState } from '@/store/scrollStore';

    export default defineComponent({
        name: 'ImageContent',
        props: {
            message: { type: Object, required: true },
        },
        setup(props) {
            const { addScrollEvent } = useScrollActions();

            const imageLoaded = () => {
                addScrollEvent();
            };
            return { imageLoaded, calcExternalResourceLink };
        },
    });
</script>
