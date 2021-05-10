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
      <div
          v-if="selectedPaths.length > 0"
          class='mx-2 hover:bg-green-600 pointer'>
        <p>{{selectedPaths.length}} File(s) selected </p>

      </div>
      <div
          v-if="selectedPaths.length > 0"
          class='mx-2 hover:bg-green-600 pointer'
          @click="downloadFiles"
      >
        <i class='fas fa-download fa-2x text-accent'></i>

      </div>

      <div
          v-if="selectedPaths.length > 0"
          class='mx-2 hover:bg-green-600 pointer'
          @click='showDeleteDialog = true'
      >

        <i class='fas fa-trash-alt fa-2x text-accent'></i>
      </div>
      <jdialog v-model='showDeleteDialog' noActions class='max-w-10'>
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
    </div>

</template>

<script lang='ts'>
  import {defineComponent, ref} from 'vue';
  let showDeleteDialog = ref(false);
    import {
      currentDirectory,
      logSelected,
      goToHome,
      goToAPreviousDirectory,
      goBack,
      selectedPaths,
        deleteFiles,
      downloadFiles,
    } from '@/store/fileBrowserStore';
    import Dialog from "@/components/Dialog.vue";

    export default defineComponent({
        name: 'TopBar',
        components: {jdialog: Dialog},
        setup() {
            return {
                goToHome,
                goBack,
                goToAPreviousDirectory,
                currentDirectory,
                logSelected,
                selectedPaths,
                deleteFiles,
              showDeleteDialog,
              downloadFiles
            };
        },
    });
</script>

<style scoped>

</style>