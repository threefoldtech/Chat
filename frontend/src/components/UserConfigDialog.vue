<template>
    <jdialog v-model="showUserConfigDialog" noActions>
        <template v-slot:title>
            <h1>Profile settings</h1>
        </template>
        <div>
            <div
                class="relative flex justify-center h-52"
                @mouseover="showEditPic = true"
                @mouseleave="showEditPic = false"
            >
                <transition name="fade">
                    <div
                        @click.stop="selectFile"
                        v-if="showEditPic"
                        class="grid cursor-pointer place-items-center bg-black bg-opacity-75 absolute w-full h-full top-0 left-0"
                    >
                        <button class="text-white">
                            <i class="fas fa-pen"></i>
                        </button>
                    </div>
                </transition>
                <img class="h-full w-52 bg-black" :src="src" />
                <!-- {{user}} -->
            </div>
            <h1 class="text-center my-4">{{ user.id }}</h1>
            <div
                class="relative w-full h-full"
                @mouseover="showEdit = true"
                @mouseleave="showEdit = false"
            >
                <transition name="fade">
                    <button
                        v-if="!isEditingStatus"
                        :class="showEdit ? 'block' : 'hidden'"
                        class="absolute top-0 right-0"
                        @click="setEditStatus(true)"
                    >
                        <i class="fas fa-pen"></i>
                    </button>
                </transition>

                <transition name="fade">
                    <button
                        v-if="isEditingStatus"
                        class="absolute top-1 right-0"
                        @click="sendNewStatus"
                    >
                        <i class="fas fa-check"></i>
                    </button>
                </transition>

                <suspense>
                    <textarea
                        v-model="userStatus"
                        class="w-full"
                        :disabled="!isEditingStatus"
                        :placeholder="myStatus"
                    ></textarea>
                </suspense>
            </div>
            <input
                class="hidden"
                type="file"
                id="fileinput"
                ref="fileinput"
                accept="image/*"
                @change="changeFile"
            />

            <div>
                <h2>Blocked Users</h2>
                <ul class="max-h-28 overflow-y-auto">
                    <template
                        v-for="blockedUser in blockedUsers"
                        :key="blockedUser"
                    >
                        <li>
                            {{ blockedUser }}
                            <button
                                class="px-4 py-2 text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-500 focus:border-blue-700 active:bg-blue-700 ease-in-out duration-150 cursor-pointer uppercase"
                                @click="unblockUser(blockedUser)"
                            >
                                unblock
                            </button>
                        </li>
                    </template>

                    <!-- <li v-if="blockedUsers.length === 0 && blockedUsersLoading">
                        ...
                    </li>
                    <li
                        v-if="blockedUsers.length === 0 && !blockedUsersLoading"
                    >
                        No blocked users
                    </li> -->
                </ul>
            </div>
        </div>
    </jdialog>
</template>

<script lang="ts">
    import {
        computed,
        defineComponent,
        onBeforeMount,
        onMounted,
        ref,
    } from 'vue';
    import { useAuthState, getMyStatus } from '../store/authStore';
    import { useSocketActions } from '../store/socketStore';
    import Dialog from '@/components/Dialog.vue';
    import AvatarImg from '@/components/AvatarImg.vue';
    import {
        deleteBlockedEntry,
        getBlockList,
        initBlocklist,
    } from '@/store/blockStore';
    import { setNewavater } from '@/store/userStore';
    import { fetchStatus } from '@/store/statusStore';
    import { useRoute, useRouter } from 'vue-router';
    import { showUserConfigDialog } from '@/services/dialogService';
    import { statusList } from '@/store/statusStore';
    import { calcExternalResourceLink } from '../services/urlService';

    export default defineComponent({
        name: 'UserConfigDialog',
        components: { AvatarImg, jdialog: Dialog },
        emits: ['addUser'],
        created: () => {
            initBlocklist();
        },
        async setup({}, ctx) {
            const { user } = useAuthState();
            const showEdit = ref(false);
            const showEditPic = ref(false);
            const fileinput = ref();
            const file = ref();
            const userStatus = ref('');
            const isEditingStatus = ref(false);
            const router = useRouter();
            const route = useRoute();
            const myStatus = await getMyStatus();

            const backOrMenu = () => {
                if (route.meta && route.meta.back) {
                    router.push({ name: <any>route.meta.back });
                    return;
                }
                showUserConfigDialog.value = true;
            };

            const selectFile = () => {
                fileinput.value.click();
            };
            const changeFile = () => {
                file.value = fileinput.value?.files[0];
                sendNewAvatar();
            };
            const removeFile = () => {
                file.value = null;
            };

            const sendNewAvatar = async () => {
                const newUrl = await setNewavater(file.value);
                await fetchStatus(user.id);
                showUserConfigDialog.value = false;
            };

            const setEditStatus = (edit: boolean) => {
                console.log(edit);
                isEditingStatus.value = edit;
                userStatus.value = user.status;
            };
            const sendNewStatus = async () => {
                const { sendSocketUserStatus } = useSocketActions();
                sendSocketUserStatus(userStatus.value);
                user.status = userStatus.value;
                isEditingStatus.value = false;
            };

            const blockedUsers = computed(() => {
                return getBlockList();
            });
            // @todo: config

            const unblockUser = async user => {
                await deleteBlockedEntry(user);
                showUserConfigDialog.value = false;
            };

            const addUser = () => {
                ctx.emit('addUser');
            };

            const status = computed(() => {
                return statusList[<string>user.id];
            });

            const src = computed(() => {
                if (!status.value || !status.value.avatar) {
                    return `https://avatars.dicebear.com/4.5/api/jdenticon/${encodeURI(
                        <string>user.id
                    )}.svg?m=14&b=%23ffffff`;
                }
                return calcExternalResourceLink(status.value.avatar);
            });

            return {
                addUser,
                backOrMenu,
                user,
                showEditPic,
                showEdit,
                fileinput,
                file,
                selectFile,
                changeFile,
                removeFile,
                sendNewAvatar,
                sendNewStatus,
                userStatus,
                setEditStatus,
                isEditingStatus,
                blockedUsers,
                unblockUser,
                route,
                showUserConfigDialog,
                src,
                myStatus,
            };
        },
    });
</script>

<style scoped>
    .configDialog {
        position: absolute;
        margin: auto;
        top: 0;
        right: 0;
        bottom: 0;
        left: 0;
        width: 800px;
        height: 600px;
        z-index: 10;
        background-color: aquamarine;
        border: 2px solid black;
    }
</style>
