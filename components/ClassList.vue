<template>
    <div>
        <h2 class="font-bold text-black mb-3">タグ</h2>
        <div v-if="classes.length>=1">
            <div v-for="(className,i) in classes" :key="'class'+i"
                class="p-1 border border-gray-400 hover:bg-gray-500 hover:text-white"
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
            this.$emit("class-clicked",index)
        }
    }
})
</script>