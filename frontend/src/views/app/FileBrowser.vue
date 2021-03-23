<template>
    <app-layout>
        <iframe
            :src="computedUrl"
            style="
                position: relative;
                top: 0;
                left: 0;
                bottom: 0;
                right: 0;
                width: 100%;
                height: 100%;
                border: none;
                margin: 0;
                padding: 0;
                overflow: hidden;
                z-index: 999999;
            "
        >
            Your browser doesn't support iframes
        </iframe>
    </app-layout>
</template>

<script lang="ts">
    import appLayout from '../../layout/AppLayout.vue';
    import { defineComponent, computed } from 'vue';
    import { useAuthState } from '../../store/authStore';

    export default defineComponent({
        name: 'Apps',
        components: {
            appLayout,
        },
        setup() {
            const { user } = useAuthState();

            const computedUrl = computed(() => {
                return `https://filebrowser.jimbertesting.be/auth/login/user/?username=${user.id}.3bot`;
            });

            return {
                computedUrl,
            };
        },
    });
</script>

<style scoped type="text/css"></style>
