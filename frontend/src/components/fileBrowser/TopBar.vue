<template>
    <div class='flex flex-row h-12 bg-white border border-gray-200 items-center'>
        <div class='mx-2 hover:bg-green-600 pointer'>
            <i class='fas fa-home fa-2x text-accent'></i>
        </div>
        <div
            class='rounded-full w-6 h-6 flex justify-center items-center '
            @click='goBack'
            :class='{
                "bg-accent hover:bg-green-600 pointer": currentDirectory !== "/",
                "bg-gray-500": currentDirectory === "/"
            }'
        >
            <i class='fas fa-arrow-up text-white'></i>
        </div>
        <div class='flex-1 mx-2'>
            <template v-for='(item,i) in currentDirectory.split("/")'>
                <span
                    class='mx-2'
                    v-if='i !== 0 && item'
                >
                    &#62;
                </span>
                <span
                    class='underline cursor-pointer'
                    v-if='item || i === 0'
                    @click='i === 0 ? goToHome() : goToAPreviousDirectory(i)'
                >
                    {{ i === 0 ? 'Home' : item }}
                </span>
            </template>
        </div>
    </div>
</template>

<script lang='ts'>
    import { defineComponent } from 'vue';
    import { currentDirectory, goToHome, goToAPreviousDirectory, goBack } from '@/store/fileBrowserStore';

    export default defineComponent({
        name: 'TopBar',
        setup() {
            return {
                goToHome,
                goBack,
                goToAPreviousDirectory,
                currentDirectory,
            };
        },
    });
</script>

<style scoped>

</style>