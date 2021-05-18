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
                <th class='text-left cursor-pointer' >Name</th>
                <th class='text-left cursor-pointer' >Extension</th>
                <th class='text-left cursor-pointer' >Size</th>
                <th class='text-left cursor-pointer' >Last Modified</th>
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
                        :checked='selectedPaths.some(x => x.fullName === item.fullName && x.extension === item.extension  && x.directory === item.directory)'
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
                        @click='handleItemClick(item)'
                    >
                        {{ item.name }}
                    </span>
                </td>
                <td>{{ extCheck(item) }}</td>
                <td>{{ sizeCheck(item) }}</td>
                <td>{{ modifiedCheck(item) }}</td>

            </tr>
            </tbody>
        </table>
    </div>
</template>

<script lang='ts'>
    import { defineComponent, ref } from 'vue';
    import moment from 'moment';
    import {
        currentDirectoryContent,
        currentDirectory,
        getIcon,
        itemAction,
        PathInfoModel, selectItem, deselectAll, selectAll,
        selectedPaths, deselectItem,
    } from '@/store/fileBrowserStore';
    import { useRouter } from 'vue-router';

    export default defineComponent({
        name: 'DirectoryContent',
        setup() {
            const router = useRouter();
            const handleSelect = (val: any, item: PathInfoModel) => {
                if (val.target.checked)
                    selectItem(item);
                else
                    deselectItem(item);
            };
            const sizeCheck = (val: any) => {
                if (val.extension) {
                    return formatBytes(val.size, 2);
                }
                return '-';
            };
            const extCheck = (val: any) => {
                if (val.extension) {
                    return val.extension;
                }
                return '-';
            };
            const modifiedCheck = (val: any) => {
                const dateObj = new Date(val.lastModified);
                const dd = dateObj.getDate();
                const mm = dateObj.getMonth() + 1;
                const yyyy = dateObj.getFullYear();
                if (moment.duration(moment().startOf('day').diff(dateObj)).asDays() < -7) {
                    return dd + '-' + mm + '-' + yyyy;
                }
                return moment(dateObj).fromNow();

            };
            const handleAllSelect = (val: any) => {
                if (val.target.checked)
                    selectAll();
                else
                    deselectAll();
            };
            const formatBytes = function(bytes, decimals) {
                if (bytes == 0) return '0 Bytes';
                let k = 1024,
                    dm = decimals || 2,
                    sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                    i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
            };

            const handleItemClick = (item: PathInfoModel) => {
                itemAction(item, router);
            }

            return {
                handleSelect,
                handleAllSelect,
                getIcon,
                handleItemClick,
                currentDirectoryContent,
                currentDirectory,
                selectedPaths,
                sizeCheck,
                extCheck,
                modifiedCheck,
            };
        },
    });
</script>

<style scoped>
    .asc:after{
        content: "\25B2"
    }

    .desc:after{
        content: "\25BC"
    }
</style>