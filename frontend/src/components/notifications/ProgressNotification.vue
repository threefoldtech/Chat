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
        <div class='ml-2 mr-6 w-full'>
            <span class='font-semibold'>{{ notification.title }}</span>
            <span class='block text-gray-500'>{{ notification.getFormattedText() }}</span>
            <div class='pt-1 w-full flex items-center'>
                <div class='flex items-center justify-between mr-2'>
                  <span class='text-xs font-semibold inline-block text-green-600'>
                      {{getProgress}}
                  </span>
                </div>
                <div class='overflow-hidden h-2 text-xs flex rounded bg-green-200 flex-1'>
                    <div :style='{width: getPercentage + "%"}'
                         class='shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500'></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang='ts'>
    import { computed, defineComponent, onMounted, ref } from 'vue';
    import { NotificationType, ProgressNotification, Status } from '@/types/notifications';

    export default defineComponent({
        name: 'ProgressNotification',
        props: {
            notification: {
                type: ProgressNotification,
                required: true,
            },
        },
        setup(props) {
            const progress = ref(props.notification.progress)
            onMounted(() => props.notification.setProgressListener((p) => {progress.value = p}));
            const getPercentage = computed(() => {
                if(props.notification.isPercentage)
                    return ~~(progress.value * 100);

                return ~~((progress.value / props.notification.max) * 100)
            });

            const getProgress = computed(() => {
                if(props.notification.isPercentage)
                    return `${~~(progress.value * 100)}%`

                return `${progress.value}/${props.notification.max}`;
            });


            return {
                getProgress,
                getPercentage,
                progress,
                Status
            }
        },
    });
</script>

<style scoped>

</style>