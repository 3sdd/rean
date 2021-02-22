<template>
    <div>
        <img :src="src"
            class="p-2 h-40 w-full object-contain"
        />
    </div>
</template>

<script lang="ts">
//TODO:プレビューの画像サイズをどうするか？
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