<template>
    <g v-if="show">
        <rect
            :x="x" :y="y" :width="width" :height="height" fill="rgba(255,0,0,0.4)" 
            stroke="red" stroke-width="4" stroke-dasharray="0"
        ></rect>
    </g>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props:{
        show:{
            type:Boolean,
            required:true,
        },
        x1:{
            type:Number,
            required:true,
        },
        y1:{
            type:Number,
            required:true,
        },
        x2:{
            type:Number,
            required:true,
        },
        y2:{
            type:Number,
            required:true,
        },
    },
    computed:{
        x(){
            return Math.min(this.x1,this.x2)
        },
        y(){
            return Math.min(this.y1,this.y2)
        },
        width(){
            return Math.max(this.x1,this.x2)-(this as any).x //TODO: as anyなかったらエラー表示される。わからん
        },
        height(){
            return Math.max(this.y1,this.y2)-(this as any).y
        }
    }
})
</script>