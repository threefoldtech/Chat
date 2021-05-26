<template>
    <div class='flex flex-row'>
        <div class='px-2 text-red-500' v-if='notification.status === Status.Error'>
            <i class='far fa-times-circle' />
        </div>
        <div class='px-2 text-green-500' v-else-if='notification.status === Status.Success'>
            <i class='far fa-check-circle' />
        </div>
        <div class='px-2 text-green-500' v-else>
        </div>
        <div class='ml-2 mr-6'>
            <span class='font-semibold'>{{notification.title}}</span>
            <span class='block text-gray-500'>{{notification.getFormattedText()}}</span>
        </div>
    </div>
</template>

<script lang='ts'>
    import { Notification, Status } from '@/types/notifications';
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'InfoNotification',
        props: {
            notification: {
                type: Notification,
                required: true,
            },
        },
        setup(props) {
            return {
                Status
            };
        },
    });
</script>

<style scoped>

</style>