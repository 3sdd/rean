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
                    <canvas :width="canvasWidth" :height="canvasHeight"
                        @mousedown="mousedown"
                        @mouseup="mouseup"
                        @mousemove="mousemove"
                        @mouseenter="mouseenter"
                        @mouseleave="mouseleave"
                        class="absolute z-40"
                    ></canvas>
                    <canvas ref="annotationCanvas" :width="canvasWidth" :height="canvasHeight"
                        class="absolute z-30"
                    >
                    </canvas>
                    <canvas ref="mainCanvas" :width="canvasWidth" :height="canvasHeight"
 
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
import {AnnotationData} from "@/utils/annotationData"
import {drawBox,clear,drawCrossLine} from "@/utils/drawing"

export default Vue.extend({
    components:{
        ClassList,
        ThumbnailViewer
    },
    data(){
        return {
            base64images:[] as Array<string>,
            canvasWidth:800,
            canvasHeight:800,
            showDotLine:false,
            makingRectangle:false,
            rectangle:{
                point1:{x:0,y:0},
                point2:{x:0,y:0}
            },
            annotationData:null as AnnotationData|null,
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
        },
        annotationCtx(){
            const canvas=<HTMLCanvasElement>this.$refs.annotationCanvas
            const ctx=canvas.getContext("2d")
            if(!ctx){
                throw new Error("エラー:getContex('2d')")
            }
            return ctx
        }
    },
    methods:{
        imageSelected(index:number){
            const previousSelectedImageIndex=this.selectedImageIndex
            this.$store.commit("project/updateSelectedImage",index)
            this.changeImage(this.selectedImageIndex)
            clear(this.annotationCtx)
            this.annotationData=new AnnotationData()

            const annotationRootPath="./TestProject/annotations"
            //TODO:annotationファイルの名前を 画像名.jsonにしたい
            const annotationPath=annotationRootPath+"\\"+`annotation_${previousSelectedImageIndex}.json`
            
            // const annotation=JSON.stringify({
            //     test:"test annotation"
            // })
            const annotation=this.annotationData?.toJson()
            if(!this.annotationData){
                console.error("no annotation data")
            }
            ApiManager.writeFile(annotationPath,annotation)
        },
        
        //canvaの画像を選択された画像に変更
        changeImage(index:number){
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
            const ctx=this.mainCtx
            clear(ctx)
            const x=e.offsetX
            const y=e.offsetY
            if(this.showDotLine){
                ctx.strokeStyle="gray"
                drawCrossLine(ctx,x,y)
            }

            if(this.makingRectangle){
                ctx.setLineDash([])
                ctx.strokeStyle="black"
                drawBox(ctx,this.rectangle.point1,{x,y})
            }
        },
        mouseenter(e:any){
            this.showDotLine=true
        },
        mouseleave(e:any){
            this.showDotLine=false
            // this.mainCtx.clearRect(0,0,this.canvasWidth,this.canvasHeight)
            clear(this.mainCtx)
        },
        mousedown(e:any){
            if(!this.makingRectangle){
                this.makingRectangle=true
                const x=e.offsetX
                const y=e.offsetY
                this.rectangle.point1.x=x
                this.rectangle.point1.y=y
            }

        },
        mouseup(e:any){
            console.log("mouseup")
            if(this.makingRectangle){
                this.makingRectangle=false
                const x=e.offsetX
                const y=e.offsetY

                this.rectangle.point2.x=x
                this.rectangle.point2.y=y

                this.addBox(this.rectangle.point1,this.rectangle.point2)
                this.annotationCtx.strokeStyle="red"
                drawBox(this.annotationCtx,this.rectangle.point1,this.rectangle.point2)
            }

        },
        addBox(point1:{x:number,y:number},potin2:{x:number,y:number}){
            
        },
    }
})
</script>