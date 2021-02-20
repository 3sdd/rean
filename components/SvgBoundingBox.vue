<template>
    <g class="bbox">
        <rect :x="xmin" :y="ymin" :width="width" :height="height" fill="rgba(255,0,0,0.4)" 
            stroke="red" stroke-width="4" stroke-dasharray="0"
            class="bbox-main"
        ></rect>
        
        <circle 
            v-for="(point,i) in fourPoints" :key="i"
            :cx="point.x" :cy="point.y" r="5" fill="red"
            class="bbox-point"
        ></circle>

        <rect :x="xmin" :y="ymin" fill="red" width="100" height="25"></rect>
        <text :x="xmin" :y="ymin" font-size="15" dominant-baseline="text-before-edge"
            fill="white"
        >
            {{label}}
        </text>
        

        
        <rect v-if="showRemoveButton" :x="xmax+10" :y="ymin+10" width="25" height="25"
            rx="2" ry="2"
            fill="gray"
            class="remove-button"
            @click="onClickRemoveButton"
        >
        </rect>
        <path :transform="`translate(${xmax+10+2},${ymin+10+2}) scale(0.2)`" d="M 10,10 l 90,90 M 100,10 l -90,90" stroke="red" stroke-width="30" 
            class="pointer-events-none"
        />
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
        label:{
            type:String,
            required:true,
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
    },
    methods:{
        onClickRemoveButton(){
            this.$emit("remove")
        }
    }
})
</script>

<style scoped>
.bbox:hover .bbox-point{
    fill:rgba(0,255,0,1);
}
.bbox:hover .bbox-main{
    fill: rgba(0,255,0,0.3);
    stroke:rgba(0,255,0,1);
}
.bbox:hover .remove-button{
    fill:rgba(0,255,0,0.3);
}
</style>