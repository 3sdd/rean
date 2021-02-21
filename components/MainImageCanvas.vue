<template>
    <canvas ref="imageCanvas" :width="canvasWidth" :height="canvasHeight">
    </canvas>
</template>

<script lang="ts">
import Vue, {PropType} from 'vue'
export default Vue.extend({
    props:{
        canvasWidth:{
            type:Number,
            required:true
        },
        canvasHeight:{
            type:Number,
            required:true
        },
        base64Image:{
            type:String as PropType<string|null>,
            required:true,
        }
    },
    computed:{
        imgCtx(){
            const canvas=<HTMLCanvasElement>this.$refs.imageCanvas
            const ctx=canvas.getContext("2d")
            if(!ctx){
                throw new Error("エラー:getContex('2d')")
            }
            return ctx
        },
    },
    watch:{
        base64Image(){
            if(this.base64Image===null){
                return
            }
            const ctx=this.imgCtx
            const base64image=this.base64Image
            const image=new Image()
            const width=this.canvasWidth
            const height=this.canvasHeight
            image.onload=(e)=>{
                console.log("DRAW")
                console.log(image.src)

                //TODO:変形されてる?
                ctx.drawImage(image,0,0,width,height)
            }
            image.src=base64image 
        }
    }
})
</script>