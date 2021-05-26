<template>
    <appLayout>
        <template v-slot:default>
            <div class='flex flex-row w-full h-full'>
                <div>
                    <SideBar/>
                </div>
                <div class='flex flex-col flex-1'>
                    <TopBar/>
                    <DirectoryContent/> 
                </div>
            </div>

        </template>
    </appLayout>
</template>

<script lang="ts">
    import appLayout from '../../layout/AppLayout.vue';
    import { defineComponent, onBeforeMount } from 'vue';
    import DirectoryContent from '@/components/fileBrowser/DirectoryContent.vue';
    import SideBar from '@/components/fileBrowser/SideBar.vue'
    import { updateContent } from '@/store/fileBrowserStore';
    import TopBar from '@/components/fileBrowser/TopBar.vue';

    export default defineComponent({
        name: 'Apps',
        components: {
            TopBar,
            appLayout, DirectoryContent, SideBar
        },
        setup() {
            onBeforeMount(async() => {
               await updateContent();
            })

            return {

            };
        },
    });
</script>

<style scoped type="text/css"></style>
