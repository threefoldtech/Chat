<template>

</template>

<script lang='ts'>
    import { defineComponent, ref } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { getFile, PathInfoModel } from '@/store/fileBrowserStore';

    export default defineComponent({
        name: 'EditFile',
        setup() {
            const route = useRoute();
            const router = useRouter();
            const fileInfo = ref<PathInfoModel>();

            const renderDocument = async () => {
                const selectedId = atob(<string>route.params.id);
                if(!selectedId) router.push({name: "filebrowser"});
                fileInfo.value = await getFile(selectedId);

            }
        }
    });
</script>

<style scoped>

</style>