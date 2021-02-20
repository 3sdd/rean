<template>
    <g class="bbox">
        <rect :x="xmin" :y="ymin" :width="width" :height="height" fill="rgba(255,0,0,0.4)" 
            stroke="red" stroke-width="4" stroke-dasharray="0"
            class="bbox-fill bbox-outline"
        ></rect>
        
        <circle 
            v-for="(point,i) in fourPoints" :key="i"
            :cx="point.x" :cy="point.y" r="5" fill="red"
            class="bbox-point"
        ></circle>

        <rect v-if="showRemoveButton">
        </rect>
    </g>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props:{
        xmin:{
            type:Number,
            required:true,
            default:0
        },
        ymin:{
            type:Number,
            required:true
        },
        xmax:{
            type:Number,
            required:true
        },
        ymax:{
            type:Number,
            required:true
        },
        showRemoveButton:{
            type:Boolean,
            required:true,
        }
    },
    computed:{
        width(){
            return <number>this.xmax-<number>this.xmin
        },
        height(){
            return <number>this.ymax-<number>this.ymin
        },
        fourPoints(){
            return [
                {x:this.xmin,y:this.ymin},
                {x:this.xmax,y:this.ymin},
                {x:this.xmax,y:this.ymax},
                {x:this.xmin,y:this.ymax}
            ]
        },
    }
})
</script>

<style scoped>

.bbox:hover>rect{
    fill:rgba(0,255,0,0.5)
}


</style>