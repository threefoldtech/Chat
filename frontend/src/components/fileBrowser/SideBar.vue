<template>
    <button v-if="showPopUp" key="on" @click="showPopUp = false" class='bg-red-500 py-2 px-4 text-white rounded-full'>
            x Close
        </button>
        <button v-else key="off" @click="showPopUp = true" class='bg-red-500 py-2 px-4 text-white rounded-full'>
            + New
        </button>
    <div class='dropdownmenu' v-bind:class="{active: showPopUp}" v-if="showPopUp">
            <div
                @click='showCreateFolderDialog = true; showPopUp = false;'
                class='flex flex-row p-4 items-center w-full hover:bg-gray-200 cursor-pointer'
            >
                <div class='mr-3 w-7'>
                    <i class="fas fa-folder-plus fa-2x text-accent"></i>
                </div>
                <span class='text-md text-gray-600'>New Folder</span>
            </div>
            <div
                @click='showCreateFileDialog = true; showPopUp = false;'
                class='flex flex-row p-4 items-center w-full hover:bg-gray-200 cursor-pointer'
            >
                <div class='mr-3 w-7'>
                    <i class="fas fa-file-upload fa-2x text-accent"></i>
                </div>
                <span class='text-md text-gray-600'>Upload Files</span>
            </div>
        </div>
    <Dialog :model-value='showCreateFolderDialog' @update-model-value='(val) => updateCreateFolderDialog(val)'>
        <template v-slot:title>
            <h1>Create folder</h1>
        </template>
        <input type='text' placeholder='New Folder' ref='newFolderInput'>
    </Dialog>

        <Dialog :model-value='showCreateFileDialog' @update-model-value='(val) => updateCreateFileDialog(val)'>
            <template v-slot:title>
                <h1>Add files</h1>
            </template>
            <div class='flex flex-col justify-center items-center'>
                <button
                    class='bg-accent text-white hover:bg-green-600'
                    @click='newFileInput.click()'
                >
                    Select files
                </button>
                <span>OR</span>
            </div>
            <input
                type='file'
                ref='newFileInput'
                hidden
                multiple
                @change='handleFileSelectChange'
            >
            <FileDropArea :show='true' @send-file='handleDragAndDrop'>
                <div class='h-44'></div>
            </FileDropArea>
            <div class='text-center'>
                {{selectedFiles.length}} files selected
                <button
                    class='bg-red-400'
                    @click='clearFiles'
                >
                    Clear
                </button>
            </div>
        </Dialog>
</template>

<script lang='ts'>
    import { defineComponent, ref } from 'vue';
    import Dialog from '@/components/Dialog.vue';
    import FileDropArea from '@/components/FileDropArea.vue';
    import { createDirectory, uploadFiles } from '@/store/fileBrowserStore';
    import Button from '@/components/Button.vue';

    export default defineComponent({
        name: 'SideBar',
        data: function(){ 
            return {
                showPopUp: false
            }
        },
        components: {
            Button, Dialog, FileDropArea,
        },
        setup() {
            const showCreateFolderDialog = ref(false);
            const showCreateFileDialog = ref(false);
            const newFolderInput = ref<HTMLInputElement>();
            const newFileInput = ref<HTMLInputElement>();
            const selectedFiles = ref<File[]>([]);

            const updateCreateFolderDialog = (val: boolean) => {
                if (!val) {
                    showCreateFolderDialog.value = false;
                    return;
                }

                if (!newFolderInput.value) return;
                if (!newFolderInput.value.value) {
                    newFolderInput.value.classList.add('border-red-500');
                    return;
                }
                createDirectory(newFolderInput.value.value);
                showCreateFolderDialog.value = false;
            };

            const updateCreateFileDialog = (val: boolean) => {
                if (!val) {
                    showCreateFileDialog.value = false;
                    return;
                }

                if (!selectedFiles.value?.length) return;
                uploadFiles(selectedFiles.value);
                clearFiles();
                showCreateFileDialog.value = false;
            };

            const handleDragAndDrop = (files: File[]) => {
                selectedFiles.value = files;
            };

            const clearFiles = () => {
                selectedFiles.value = [];
            }

            const handleFileSelectChange = () => {
                Array.from(newFileInput.value?.files).forEach(file => selectedFiles.value.push(file));
            }

            return {
                showCreateFolderDialog,
                showCreateFileDialog,
                newFolderInput,
                newFileInput,
                handleDragAndDrop,
                updateCreateFolderDialog,
                handleFileSelectChange,
                selectedFiles,
                clearFiles,
                updateCreateFileDialog
            };
        },
    });
</script>

<style scoped>
    .dropdownmenu{
        top: 100%;
        position: absolute;
        z-index: 10;
        min-width: 165px;
        margin-top: 0.5rem;
        overflow-y: auto;
        border-radius: 8px;
        background-color: white;
        border: 1px solid grey;
    }
</style>