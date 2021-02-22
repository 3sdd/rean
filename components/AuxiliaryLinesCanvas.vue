<template>
    <div>
    <!-- <canvas ref="mainCanvas" :width="canvasWidth" :height="canvasHeight"
    ></canvas> -->
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {drawCrossLine, clear} from "@/utils/drawing"

export default Vue.extend({
    props:{
        // canvasWidth:{
        //     type:Number,
        //     required:true
        // },
        // canvasHeight:{
        //     type:Number,
        //     required:true
        // },
    },
    data(){
        return {
            showDotLine:true,
        }
    },
    computed:{
        mainCtx(){
            const canvas=<HTMLCanvasElement>this.$refs.mainCanvas
            const ctx=canvas.getContext("2d")
            if(!ctx){
                throw new Error("エラー:getContex('2d')")
            }
            return ctx
        },
    },
    methods:{
        mouseenter(e:MouseEvent){
            this.showDotLine=true
            console.log("aaaa")
        },
        mouseleave(e:MouseEvent){
            this.showDotLine=false
            clear(this.mainCtx)
        },
        mousemove(e:MouseEvent){
            console.log("III")
            const ctx=this.mainCtx
            clear(ctx)
            const x=e.offsetX
            const y=e.offsetY
            if(this.showDotLine){
                ctx.strokeStyle="gray"
                drawCrossLine(ctx,x,y)
            }

            // if(this.makingRectangle){
            //     ctx.setLineDash([])
            //     ctx.strokeStyle="black"
            //     drawBox(ctx,this.rectangle.point1,{x,y})
            // }
        }
    }
})
</script>