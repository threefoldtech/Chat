<template>
    <div class='absolute w-80 h-full right-0 top-0 z-40 flex flex-col items-end justify-end'>
        <NotificationCard
            v-for='notification in notifications'
            :key='notification.key'
            :notification='notification'
            class='w-full p-2'
        />
        <button @click='addNotification'>Add Notification</button>
        <button @click='addProgress'>Add Progress</button>
        <button @click='addError'>Add Error</button>
    </div>
</template>

<script lang='ts'>
    import { defineComponent } from 'vue';
    import {
        addNotification, createErrorNotification,
        createNotification,
        createProgressNotification,
        notifications,
    } from '@/store/notificiationStore';
    import NotificationCard from '@/components/notifications/NotificationCard.vue';

    export default defineComponent({
        name: 'NotificationSection',
        components: { NotificationCard },
        setup() {
            let i =0;
            return {
                notifications,
                addNotification: () => {
                    createNotification("Tite;" + i++, "bla")
                },
                addProgress: () => {
                    const not = createProgressNotification("title", " tttexxxt", 10)
                    let i = 0;
                    setInterval(() => {
                        not.updateProgress(++i);
                        if(i === 7)
                            not.failed();
                    }, 1000);
                },
                addError: () => {
                  createErrorNotification("Error", "Gilles is een wost");
                },
                log: (b: any) => {
                    console.log(b)
                }
            }
        }
    });
</script>

<style scoped>

</style>