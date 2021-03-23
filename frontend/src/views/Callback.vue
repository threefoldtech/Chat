<template>
    <div>
        <h2>callback</h2>
    </div>
</template>

<script lang="ts">
    import { defineComponent } from 'vue';
    import { useRoute } from 'vue-router';

    export default defineComponent({
        name: 'Home',
        setup() {
            const route = useRoute();

            // console.log('response.headers', response.headers);

            // verify the callback response?
            window.opener.postMessage({
                message: 'LoginRedirectSuccess',
            });
        },
    });
</script>
