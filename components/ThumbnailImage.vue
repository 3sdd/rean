<template>
    <div>
        <img :src="src"
            class="p-2 bg-gray-900"
        />
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props:{
        src:{
            type:String,
            required:true,

        }
    }
})
</script>