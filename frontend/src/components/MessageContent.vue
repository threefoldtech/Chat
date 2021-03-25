<template>
    <suspense>
        <component :is="contentComponent" :message="message" />
    </suspense>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    import StringContent from '@/components/MessageContentType/StringContent.vue';
    import SystemContent from '@/components/MessageContentType/SystemContent.vue';
    import FileContent from '@/components/MessageContentType/FileContent.vue';
    import AudioContent from '@/components/MessageContentType/AudioContent.vue';
    import ImageContent from '@/components/MessageContentType/ImageContent.vue';
    import GifContent from '@/components/MessageContentType/GifContent.vue';
    import JoinedVideoRoomContent from '@/components/MessageContentType/JoinedVideoRoomContent.vue';
    import QuoteContent from '@/components/MessageContentType/QuoteContent.vue';
    import GroupUpdateContent from '@/components/MessageContentType/GroupUpdateContent.vue';
    import { getComponentForType } from '@/services/contentService';
    import AvatarImg from '@/components/AvatarImg.vue';

    export default defineComponent({
        name: 'MessageContent',
        components: {
            AvatarImg,
            StringContent,
            SystemContent,
            FileContent,
            AudioContent,
            ImageContent,
            GifContent,
            QuoteContent,
            GroupUpdateContent,
            JoinedVideoRoomContent
        },
        props: {
            message: {
                type: Object,
                required: true,
            },
        },
        setup(props) {
            return {
                contentComponent: getComponentForType(props.message),
            };
        },
    });
</script>
