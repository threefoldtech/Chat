<template>
    <div>
        <table class='h-full w-full' :key='currentDirectory'>
            <thead>
            <tr>
                <th class='text-left p-2'>
                    <input
                        type='checkbox'
                        @change='handleAllSelect'
                        :checked='currentDirectoryContent.length === selectedPaths.length'
                    >
                </th>
                <th class='text-left'>Name</th>
                <th class='text-left'>Size</th>
                <th class='text-left'>Last Modified</th>
            </tr>
            </thead>
            <tbody>
            <tr
                v-for='item in currentDirectoryContent'
                class='hover:bg-gray-200 cursor-pointer h-10 border border-gray-300'
                :key='item.fullName'
            >
                <td class='text-left p-2'>
                    <input
                        type='checkbox'
                        @change='(val) => handleSelect(val, item)'
                        :checked='selectedPaths.some(x => x.fullName === item.fullName && x.extension === item.extension)'
                    >
                </td>
                <td class='flex flex-row items-center text-md h-full px-2'>
                    <div class='mr-3 w-7'>
                        <i class='fa-2x text-accent'
                           :class='getIcon(item)'
                        ></i>
                    </div>
                    <span
                        class='hover:underline'
                        @click='itemAction(item)'
                    >
                        {{ item.name }}
                    </span>
                </td>
                <td>{{ item.size ?? '-' }}</td>
                <td>{{ item.lastModified }}</td>
            </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang='ts'>
    import { defineComponent } from 'vue';
    import {
        currentDirectoryContent,
        currentDirectory,
        getIcon,
        itemAction,
        PathInfoModel, selectItem, deselectAll, selectAll,
        selectedPaths, deselectItem,
    } from '@/store/fileBrowserStore';

    export default defineComponent({
        name: 'DirectoryContent',
        setup() {

            const handleSelect = (val: any, item: PathInfoModel) => {
                if (val.target.checked)
                    selectItem(item);
                else
                    deselectItem(item);
            };

            const handleAllSelect = (val: any) => {
                if (val.target.checked)
                    selectAll();
                else
                    deselectAll();
            };

            return {
                handleSelect,
                handleAllSelect,
                getIcon,
                itemAction,
                currentDirectoryContent,
                currentDirectory,
                selectedPaths,
            };
        },
    });
</script>

<style scoped>

</style>