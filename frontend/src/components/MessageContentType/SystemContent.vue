<template>
    <div class="justify-around">
        <u
            ><i>{{ message.body }}</i></u
        >
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';

    export default defineComponent({
        name: 'SystemContent',
        props: {
            message: { type: Object, required: true },
        },
        setup(props) {
            return {};
        },
    });
</script>
