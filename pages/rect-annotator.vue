<template>
    <div class="h-screen flex flex-col bg-red-200">

        <div class="p-2 bg-blue-200">
            <p>残り枚数 10000枚</p>
        </div>
        <div class="flex-1 flex flex-row bg-blue-400">
            <div class="w-40 h-ful overflow-y-auto">
                <ThumbnailViewer 
                    :base64images="base64images"
                    :selectedImageIndex="selectedImageIndex"
                    @image-selected="imageSelected"
                >
                </ThumbnailViewer>
            </div>
            <div class="flex-1 bg-purple-300">
                <div>
                    {{projectInfo}}
                </div>
                <div class="bg-green-300 flex justify-center items-center h-full relative">
                    <canvas ref="mainCanvas" :width="canvasWidth" :height="canvasHeight"
                        @mousemove="mousemove"
                        class="absolute z-20"
                    ></canvas>
                    <canvas ref="imageCanvas" :width="canvasWidth" :height="canvasHeight"
                        class="absolute z-10"
                    >
                    </canvas>
                </div>
            </div>
            <div class="w-48 bg-purple-600 p-2">
                <ClassList :classes="classes"></ClassList>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import Vue from 'vue'
import {ApiManager} from "@/utils/apiManager"
import ClassList from "@/components/ClassList.vue"
import ThumbnailViewer from "@/components/ThumbnailViewer.vue"
export default Vue.extend({
    components:{
        ClassList,
        ThumbnailViewer
    },
    data(){
        return {
            // classes:[] as Array<string>, 
            base64images:[] as Array<string>,
            canvasWidth:800,
            canvasHeight:800,
        }
    },
    async mounted(){
        const path="./TestProject/classes.txt" //TODO:プロジェクトのclassファイルに変える
        const classes=await ApiManager.readClasses(path)
        this.$store.commit("project/loadClasses",classes)

        ApiManager.maximizeWindow()

        const imgRoot="./TestProject/images" //TODO:プロジェクトの画像フォルダーのパスに変える
        const imageFiles=await ApiManager.readdir(imgRoot)

        for(const imgFile of imageFiles){
            const imgPath=imgRoot+"\\"+imgFile
            const base64Image=await ApiManager.readImageAsBase64(imgPath)
            this.base64images.push("data:image/png;base64,"+base64Image)
        }
        
    },
    computed:{
        projectInfo(){
            return this.$store.state.project.projectInfo
        },

        classes():string[]{
            return this.projectInfo.classes as string[]
        },
        selectedImageIndex():number{
            return this.projectInfo.selectedImageIndex as number
        },

        imgCtx(){
            const canvas=<HTMLCanvasElement>this.$refs.imageCanvas
            const ctx=canvas.getContext("2d")
            if(!ctx){
                throw new Error("エラー:getContex('2d')")
            }
            return ctx
        },
        mainCtx(){
            const canvas=<HTMLCanvasElement>this.$refs.mainCanvas
            const ctx=canvas.getContext("2d")
            if(!ctx){
                throw new Error("エラー:getContex('2d')")
            }
            return ctx
        }
    },
    methods:{
        imageSelected(index:number){
            this.$store.commit("project/updateSelectedImage",index)
            this.changeCanvasImage(this.selectedImageIndex)
        },
        
        //canvaの画像を選択された画像に変更
        changeCanvasImage(index:number){
            const ctx=this.imgCtx

            const base64image=this.base64images[index]

            const image=new Image()
            const width=this.canvasWidth
            const height=this.canvasHeight
            image.onload=(e)=>{
                //TODO:変形されてる?
                ctx.drawImage(image,0,0,width,height)
            }
            image.src=base64image
        },
        mousemove(e:any){
            this.mainCtx.clearRect(0,0,this.canvasWidth,this.canvasHeight)
            const x=e.offsetX
            const y=e.offsetY

            this.drawCrossLine(x,y)
        },
        drawCrossLine(x:number,y:number){
            const ctx=this.mainCtx 

            ctx.beginPath()
            ctx.strokeStyle="black"
            ctx.lineWidth=2
            ctx.moveTo(x,0)
            ctx.lineTo(x,this.canvasWidth)
            ctx.stroke()
            ctx.closePath()
            
            ctx.beginPath()
            ctx.moveTo(0,y)
            ctx.lineTo(this.canvasHeight,y)
            ctx.stroke()
            ctx.closePath()
        }
    }
})
</script>