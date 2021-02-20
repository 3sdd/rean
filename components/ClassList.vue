<template>
    <div>
        <h2 class="font-bold text-white mb-3">タグ</h2>
        <div class="text-white">
            <div v-for="(className,i) in classes" :key="'class'+i"
                class="p-1 border border-gray-400 hover:bg-purple-400"
                @click="onClick(i)"
            >
                {{className}}
            </div>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props:{
        classes:{
            type:Array,
            required:false,
            default:()=>[]
        }
    },
    methods:{
        onClick(index:number){
            this.$nuxt.$emit("class-clicked",index)
        }
    }
})
</script>