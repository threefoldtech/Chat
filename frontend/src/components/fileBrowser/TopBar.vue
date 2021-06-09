<template>
    <div class='flex flex-row h-25 bg-grey-100 border items-center relative pb-6 pt-2'>
        <div
            class='mx-2 hover:text-black cursor-pointer'
            @click='goToHome'
        >
            <i class='fas fa-home fa-lg text-black'></i>
        </div>
        <div
            class='w-6 h-6 flex justify-center items-center'
            @click='goBack'
            :class='{
                "hover:text-accent cursor-pointer": currentDirectory !== "/",
                "text-gray-500": currentDirectory === "/"
            }'
        >
            <i class='fas fa-angle-left fa-2x text-black'></i>
        </div>
        <div class='flex flex-1 mx-2 bg-gray-200 h-9 rounded-full px-6 items-center'>
            <template v-for='(item,i) in currentDirectory.split("/")'>
                <span
                    class='mx-2'
                    v-if='i !== 0 && item'
                >
                    &#62;
                </span>
                <span
                    class='cursor-pointer'
                    v-if='item || i === 0'
                    @click='i === 0 ? goToHome() : goToAPreviousDirectory(i)'
                >
                    {{ i === 0 ? 'Home' : item }}
                </span>
            </template>
        </div>
        <div
            v-if='selectedPaths.length > 0'
            class='mx-2'>
            <p>{{ selectedPaths.length }} File(s) selected </p>

        </div>
        <div
            v-if='selectedPaths.length === 1'
            class='mx-2 cursor-pointer'
            @click='showRenameDialog = true'
        >
            <span class='text-gray-400 hover:text-gray-500'>
                <i class='fas fa-pen'></i>
            </span>
        </div>
        <div
            v-if='selectedPaths.length > 0'
            class='mx-2 cursor-pointer'
            @click='downloadFiles'
        >
             <span class='text-gray-400 hover:text-gray-500'>
                <i class='fas fa-download'></i>
             </span>
        </div>

        <div
            v-if='selectedPaths.length > 0'
            class='mx-2 cursor-pointer'
            @click='showDeleteDialog = true'
        >
        <span class='text-red-300 hover:text-red-500'>
            <i class='fas fa-trash-alt'></i>
        </span>
        </div>
        <div
            v-if='selectedPaths.length > 0 || copiedFiles.length  > 0'
            class='mx-2 px-2 py-1 text-white font-bold bg-green-400 border-2 border-green-400 hover:text-green-400 hover:bg-white rounded-md cursor-pointer flex fex-row'
            @click='copyPasteSelected'
        >
            <div v-if='copiedFiles.length <= 0'><i class='fas fa-copy mr-1'></i></div>
            <p>{{ copyStatus }}</p>
            <div
                @click.stop='clearClipboard'
                v-if='copiedFiles.length
                > 0'>
                <i class='fas fill-current text-red-400 fa-window-close fa-1x ml-1'></i>
            </div>
        </div>
        <div class='collapsed-bar:hidden px-2 relative'>
            <input
                type='text'
                placeholder='Search...'
                class='h-9 px-4 rounded-full transition-none'
                v-model='searchDirValue'
                @input="debounceSearch"
            />
            <span
                v-if="searchDirValue"
                @click.prevent="searchDirValue = ''; searchResults = []"
                class="absolute inset-y-0 right-1 pr-3 flex items-center cursor-pointer"
            >
            x
        </span>
        </div>
        <div class="red-btn">
            <div class='relative'>
                <AddButton/>
            </div>
        </div>
        <jdialog v-model='showDeleteDialog' @update-model-value="showDeleteDialog = false" noActions class='max-w-10'>
            <template v-slot:title class='center'>
                <h1 class='text-center'>Deleting Files</h1>
            </template>
            <div>
                Do you really want to delete {{ selectedPaths.length }} file(s)?
            </div>
            <div class='grid grid-cols-2 mt-2'>
                <button @click='deleteFiles();showDeleteDialog = false;' class='bg-red-500 p-2 text-white font-bold'>
                    YES
                </button>
                <button @click='showDeleteDialog = false' class='p-2'>
                    NO
                </button>
            </div>
        </jdialog>

        <jdialog v-model='showRenameDialog' @update-model-value="showRenameDialog = false" noActions class='max-w-10'>
            <template v-slot:title class='center'>
                <h1 class='text-center'>Renaming {{ selectedPaths[0].name }}</h1>
            </template>
            <div>
                <input
                    v-model='newName'
                    :placeholder='selectedPaths[0].name'
                    tabindex='0'
                    maxlength='50'
                />
            </div>
            <div class='grid grid-cols-2 mt-2'>
                <button @click='renameFile(selectedPaths[0], newName);newName = "";showRenameDialog = false;'
                        class='bg-red-500 p-2 text-white font-bold'>
                    RENAME
                </button>
                <button @click='showRenameDialog = false;newName = ""' class='p-2'>
                    CANCEL
                </button>
            </div>
        </jdialog>
    </div>

</template>

<script lang='ts'>
    import { defineComponent, ref } from 'vue';

    let showDeleteDialog = ref(false);
    let showRenameDialog = ref(false);
    let newName = ref<string>('');

    import {
        currentDirectory,
        goToHome,
        goToAPreviousDirectory,
        goBack,
        selectedPaths,
        deleteFiles,
        downloadFiles,
        copyPasteSelected,
        copyStatus,
        copiedFiles,
        clearClipboard,
        renameFile,
        searchDir,
        searchDirValue,
        searchResults,
    } from '@/store/fileBrowserStore';
    import Dialog from '@/components/Dialog.vue';
    import { showUserConfigDialog } from '@/services/dialogService';
    import Button from '@/components/Button.vue';
    import AddButton from '@/components/fileBrowser/AddButton.vue';

    export default defineComponent({
        name: 'TopBar',
        
        components: { AddButton, Button, jdialog: Dialog },
        setup() {
            let debounce
            function debounceSearch(event) {
                clearTimeout(debounce);
                debounce = setTimeout(() => {
                    if (searchDirValue.value === '') {
                        searchResults.value = [];
                        return;
                    }
                    searchDir();
                }, 600);
            }

            return {
                goToHome,
                goBack,
                goToAPreviousDirectory,
                currentDirectory,
                selectedPaths,
                deleteFiles,
                showDeleteDialog,
                showRenameDialog,
                downloadFiles,
                copyPasteSelected,
                copyStatus,
                copiedFiles,
                clearClipboard,
                newName,
                renameFile,
                searchDirValue,
                searchDir,
                searchResults,
                debounceSearch,
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

    .red-btn{
        position: absolute;
        bottom: -13px;
        left: 0;
    }
</style>