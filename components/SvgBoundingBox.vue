<template>
    <g class="bbox cursor-move">
        <rect :x="xmin" :y="ymin" :width="width" :height="height" :fill="transparentColor" 
            :stroke="color" stroke-width="4" stroke-dasharray="0"
            class="bbox-main"
            @mousedown="startDrag"
            @mouseup="endDrag"
            @mousemove="drag"
            @mouseleave="endDrag"
            @click="clickBoundingBox"
        ></rect>

        <rect :x="xmin" :y="ymin" :fill="color" width="100" height="25" 
            class="rect-label"
        ></rect>
        <text :x="xmin" :y="ymin" font-size="15" dominant-baseline="text-before-edge"
            fill="white"
        >
            {{label}}
        </text>

        <line :x1="xmin" :y1="ymin" :x2="xmin" :y2="ymax"
            :stroke="lineStroke" 
            stroke-width="10"
            class="cursor-left"
            @mousedown="startScaling('left')"
        ></line>
        <line :x1="xmin" :y1="ymin" :x2="xmax" :y2="ymin" 
            :stroke="lineStroke" 
            stroke-width="10"
            class="cursor-up"
            @mousedown="startScaling('up')"
        ></line>
        <line :x1="xmax" :y1="ymin" :x2="xmax" :y2="ymax" 
            :stroke="lineStroke" 
            stroke-width="10"
            class="cursor-right"
            @mousedown="startScaling('right')"
        ></line>
        <line :x1="xmax" :y1="ymax" :x2="xmin" :y2="ymax" 
            :stroke="lineStroke" 
            stroke-width="10"
            class="cursor-down"
            @mousedown="startScaling('down')"
        ></line>

        <circle 
            v-for="(point,i) in fourPoints" :key="i"
            :cx="point.x" :cy="point.y" r="5" :fill="color"
            class="bbox-point"
            :class="circleClass(i)"
            @mousedown="startScaling(getCircleScaleMode(i))"
            @mouseup="finishScalingBoundingBox(i)"
        ></circle>
        
        <g v-if="isSelected">
            <rect v-if="showRemoveButton" :x="xmax+10" :y="ymin+10" width="25" height="25"
                rx="2" ry="2"
                fill="gray"
                class="remove-button cursor-pointer"
                @click="onClickRemoveButton"
                
            >
            </rect>
            <path :transform="`translate(${xmax+10+2},${ymin+10+2}) scale(0.2)`" d="M 10,10 l 90,90 M 100,10 l -90,90" :stroke="color" stroke-width="30" 
                class="pointer-events-none"
            />
        </g>
    </g>
</template>

<script lang="ts">
import Vue from 'vue'
import {ScaleMode} from "@/utils/scaleMode"

export default Vue.extend({
    props:{
        isSelected:{
            type:Boolean,
            required:false,
            default:false,
        },
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
    data(){
        return {
            dragged:false,
            color:"rgba(100,100,100,1)",
            transparentColor:"rgba(100,100,100,0.2)",
            lineStroke:"rgba(0,0,255,0.0)"
        }
    },
    computed:{
        width(){
            return <number>this.xmax-<number>this.xmin
        },
        height(){
            return <number>this.ymax-<number>this.ymin
        },
        //TODO:順番変えたい
        fourPoints(){
            return [
                {x:this.xmin,y:this.ymin},
                {x:this.xmax,y:this.ymin},
                {x:this.xmax,y:this.ymax},
                {x:this.xmin,y:this.ymax}
            ]
        },
        circleClass(){
            return function(i:number){
                switch(i){
                    case 0:
                    case 2:
                        return "cursor-nwse"
                    case 1:
                    case 3:
                        return "cursor-nesw"
                    default:
                        return ""
                }
            }
        }
    },
    methods:{
        onClickRemoveButton(){
            this.$emit("remove")
        },
        startDrag(event:MouseEvent){
            // console.log("start drag")
            this.dragged=true
            
        },
        endDrag(event:MouseEvent){
            // console.log("end drag")
            this.dragged=false
        },
        drag(event:MouseEvent){
            // console.log("drag")
            if(this.dragged){
                event.preventDefault()
                const dragX=event.movementX
                const dragY=event.movementY
                
                //移動
                this.$emit("move-bounding-box",{
                    xmin:this.xmin+dragX,
                    xmax:this.xmax+dragX,
                    ymin:this.ymin+dragY,
                    ymax:this.ymax+dragY
                })
                this.$emit("update:xmin",this.xmin+dragX)
                this.$emit("update:xmax",this.xmax+dragX)
                this.$emit("update:ymin",this.ymin+dragY)
                this.$emit("update:ymax",this.ymax+dragY)
            }
        },
        clickBoundingBox(){
            this.$emit("click-bounding-box")
        },
        startScalingBoundingBox(index:number){
            // console.log("SCALE start")
            this.$emit("start:scale")
        },
        finishScalingBoundingBox(index:number){
            // console.log("SCALE finished")
            this.$emit("finish:scale")
        },
        startScaling(mode:ScaleMode){
            this.$emit("start-scale",mode)
        },
        getCircleScaleMode(index:number){
            switch(index){
                case 0:
                    return "upper-left"
                case 1:
                    return "upper-right"
                case 2:
                    return "lower-right"
                case 3:
                    return "lower-left"
                default:
                    throw new Error("not found scale mode")
                
            }
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
.bbox:hover .rect-label{
    fill:rgba(0,255,0,1);
}

.cursor-nwse{
    cursor: nwse-resize ;
}
.cursor-nesw{
    cursor: nesw-resize;
}
.cursor-left{
    cursor: e-resize;
}
.cursor-up{
    cursor: n-resize;
}
.cursor-right{
    cursor: w-resize;
}
.cursor-down{
    cursor: s-resize;
}
</style>