import { ref } from 'vue';
export const showSideBar = ref(false);

export const toggleSideBar = () => {
    showSideBar.value = !showSideBar.value;
}
