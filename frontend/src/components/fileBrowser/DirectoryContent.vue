<template>
    <div class='h-full overflow-y-auto'>
        <FileDropArea @send-file='uploadFile' class='h-full'>
            <table class='w-full box-border' :key='currentDirectory'>
                <thead>
                <tr>
                    <th class='text-left p-2'>
                        <input
                            type='checkbox'
                            @change='handleAllSelect'
                            :checked='currentDirectoryContent.length === selectedPaths.length'
                        >
                    </th>
                    <th class='text-left cursor-pointer'>Name</th>
                    <th class='text-left cursor-pointer'>Extension</th>
                    <th class='text-left cursor-pointer'>Size</th>
                    <th class='text-left cursor-pointer'>Last Modified</th>
                </tr>
                </thead>
                <tbody>
                <tr
                    v-for='item in currentDirectoryContent'
                    class='hover:bg-gray-200 cursor-pointer h-10 border-b border-t border-gray-300'
                    :key='item.fullName'
                >
                    <td class='text-left p-2'>
                        <input
                            type='checkbox'
                            @change='(val) => handleSelect(val, item)'
                            :checked='selectedPaths.some(x => x.fullName === item.fullName && x.extension === item.extension  && x.path === item.path)'
                        >
                    </td>
                    <td >
                        <div class='flex flex-row items-center text-md'>
                            <div class='mr-3 w-7'>
                                <i class='fa-2x'
                                   :class='getIcon(item) + " " + getIconColor(item)'
                                ></i>
                            </div>
                            <span
                                class='hover:underline'
                                @click='handleItemClick(item)'
                            >
                                {{ item.name }}
                            </span>
                        </div>
                    </td>
                    <td>{{ extCheck(item) }}</td>
                    <td>{{ sizeCheck(item) }}</td>
                    <td>{{ modifiedCheck(item) }}</td>

                </tr>
                </tbody>
            </table>
        </FileDropArea>
    </div>
</template>

<script lang='ts'>
    import { defineComponent } from 'vue';
    import moment from 'moment';
    import {
        currentDirectory,
        currentDirectoryContent,
        deselectAll,
        deselectItem,
        FileType,
        itemAction,
        PathInfoModel,
        selectAll,
        selectedPaths,
        selectItem, uploadFile,
    } from '@/store/fileBrowserStore';
    import { useRouter } from 'vue-router';
    import FileDropArea from '@/components/FileDropArea.vue';

    export default defineComponent({
        name: 'DirectoryContent',
        components: { FileDropArea },
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
            };

            const getIconColor = (item: PathInfoModel) => {
                if (item.isDirectory) return 'text-yellow-600';
                switch (item.fileType) {
                    case FileType.Excel:
                        return 'text-green-400';
                    case FileType.Word:
                        return 'text-blue-400';
                    case FileType.Powerpoint:
                        return 'text-red-400';
                    default:
                        return 'text-gray-600';
                }
            };

            const getIcon = (item: PathInfoModel) => {
                if (item.isDirectory) return 'far fa-folder';
                switch (item.fileType) {
                    case FileType.Video:
                        return 'far fa-file-video';
                    case FileType.Word:
                        return 'far fa-file-word';
                    case FileType.Image:
                        return 'far fa-file-image';
                    case FileType.Pdf:
                        return 'far fa-file-pdf';
                    case FileType.Csv:
                        return 'far fa-file-csv';
                    case FileType.Audio:
                        return 'far fa-file-audio';
                    case FileType.Archive:
                        return 'far fa-file-archive';
                    case FileType.Excel:
                        return 'far fa-file-excel';
                    case FileType.Powerpoint:
                        return 'far fa-file-powerpoint';
                    default:
                        return 'far fa-file';
                }
            };

            return {
                handleSelect,
                handleAllSelect,
                getIcon,
                getIconColor,
                handleItemClick,
                currentDirectoryContent,
                currentDirectory,
                selectedPaths,
                sizeCheck,
                extCheck,
                modifiedCheck,
                uploadFile,
            };
        },
    });
</script>

<style scoped>
    .asc:after {
        content: "\25B2"
    }

    .desc:after {
        content: "\25BC"
    }
</style>