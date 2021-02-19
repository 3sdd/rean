<template>
    <div>
        <img :src="src"
            class="p-2 bg-gray-900 h-40 w-full"
            width=""
            height="100px"
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