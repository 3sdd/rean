<template>
    <div class="h-screen flex flex-col bg-red-200">

        <div class="p-2 bg-blue-200">
            <p>残り枚数 10000枚</p>
        </div>
        <div class="flex-1 flex flex-row bg-blue-400">
            <div class="w-40 h-ful overflow-y-auto">
                <ThumbnailViewer 
                    :base64images="getBase64Images()"
                    :selectedImageIndex="selectedImageIndex"
                    @image-selected="imageSelected"
                >
                </ThumbnailViewer>
            </div>
            <div class="flex-1 bg-purple-300">
                <div>
                    {{projectInfo}}
                </div>
                <div>
                    {{hoverBoundingBox}}
                </div>
                <div class="bg-green-300 flex justify-center items-center h-full relative">
                    <canvas ref="mainCanvas" :width="canvasWidth" :height="canvasHeight"
 
                        class="absolute z-20"
                    ></canvas>
                    <canvas ref="imageCanvas" :width="canvasWidth" :height="canvasHeight"
                        class="absolute z-10"
                    >
                    </canvas>
                    <svg :width="canvasWidth" :height="canvasHeight"  
                        :viewBox="`0 0 ${canvasWidth} ${canvasHeight}`" 
                        xmlns="http://www.w3.org/2000/svg"
                        class="z-50"
                        :key="selectedImageIndex"

                        @mousedown="mousedown"
                        @mouseup="mouseup"
                        @mousemove="mousemove"
                        @mouseenter="mouseenter"
                        @mouseleave="mouseleave"
                    >
                        <g v-if="annotationData!==null" 
                            @mouseenter="mouseenterSvgBoundingBox"
                            @mouseleave="mouseleaveSvgBoundingBox"
                            @mouseover="mouseoverSvgBoundingBox"
                            ref="bboxContainer"
                        >
                            <SvgBoundingBox
                                v-for="(bbox,i) in annotationData.boundingBoxes" :key="'bbox_'+i"
                                :xmin.sync="bbox.xmin" :ymin.sync="bbox.ymin" 
                                :xmax.sync="bbox.xmax" :ymax.sync="bbox.ymax"
                                :label="bbox.label"
                                :showRemoveButton="true"
 
                                @remove="removeBoundingBox(i)"
                            >
                            </SvgBoundingBox>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="w-48 bg-purple-600 p-2">
                <ClassList :classes="classes"
                    @class-clicked="onClickClass"
                ></ClassList>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import Vue from 'vue'
import {ApiManager} from "@/utils/apiManager"
import ClassList from "@/components/ClassList.vue"
import ThumbnailViewer from "@/components/ThumbnailViewer.vue"
import {AnnotationData, BoundingBox} from "@/utils/annotationData"
import {drawBox,clear,drawCrossLine, drawBoundingBoxes,drawBoundingBox} from "@/utils/drawing"
import { ProjectInfo } from '~/utils/projectInfo'
import {IPoint} from "@/utils/utils"
import SvgBoundingBox from "@/components/SvgBoundingBox.vue"
import { IImageData } from '~/utils/imageData'

export default Vue.extend({
    components:{
        ClassList,
        ThumbnailViewer,

        SvgBoundingBox
    },
    data(){
        return {
            // base64images:[] as Array<string>,
            imageDataList:[] as Array<IImageData>,
            canvasWidth:800,
            canvasHeight:800,
            showDotLine:false,
            makingRectangle:false,
            rectangle:{
                point1:{x:0,y:0},
                point2:{x:0,y:0}
            },
            annotationData:null as AnnotationData|null,
            hoverBoundingBox:false,
        }
    },
    async mounted(){
        const path="./TestProject/classes.txt" //TODO:プロジェクトのclassファイルに変える
        const classes=await ApiManager.readClasses(path)
        this.$store.commit("project/loadClasses",classes)

        ApiManager.maximizeWindow()

        const imgRoot="./TestProject/images" //TODO:プロジェクトの画像フォルダーのパスに変える
        const imageFiles=await ApiManager.readdir(imgRoot)

        this.annotationData=new AnnotationData()

        for(const imgFile of imageFiles){
            const imgPath=imgRoot+"\\"+imgFile
            const imageData=await ApiManager.readImageData(imgPath)
            console.log(imageData)
            // this.base64images.push(imageData.base64image)
            this.imageDataList.push(imageData)
        }
        //画像0番目表示
        this.imageSelected(0)
        
    },
    computed:{
        projectInfo(){
            return this.$store.state.project.projectInfo as ProjectInfo
        },

        classes():string[]{
            return this.projectInfo.classes
        },
        selectedImageIndex():number{
            return this.projectInfo.selectedImageIndex
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
    },
    methods:{
        //TODO: selectedImageIndexがこの関数内で indexの値に変更されるようになっている　のをどうにかする
        async imageSelected(index:number){
            const previousSelectedImageIndex=this.selectedImageIndex
            //前の選択画像と次に選択したものが同じものならなにもしない
            if(previousSelectedImageIndex===index){
                return
            }
            const annotationRootPath="./TestProject/annotations"
            //アノテーションデータを保存する (前の画像があるとき)

            if(previousSelectedImageIndex!==-1){  //前の選択画像があるとき
                //TODO:アノテーションファイルのパスの取得関数欲しい
                const filename=this.imageDataList[previousSelectedImageIndex].filename
                const annotationPath=annotationRootPath+"\\"+`${filename}.json`
                const annotation=this.annotationData?.toJsonString()
                console.log(annotation)
                if(!this.annotationData){
                    console.error("no annotation data")
                }
                ApiManager.writeFile(annotationPath,annotation)
            }

            //次の画像に変える
            this.$store.commit("project/updateSelectedImage",index)
            // clear(this.annotationCtx)
            this.changeImage(this.selectedImageIndex)
            //TODO:アノテーションファイルのパスの取得関数欲しい
            const nextImageData=this.imageDataList[index]
            const nextAnnotationPath=annotationRootPath+"\\"+`${nextImageData.filename}.json`
            const existsAnnotation=await ApiManager.existsPath(nextAnnotationPath)
            if(existsAnnotation){
                const jsonString=await ApiManager.readFile(nextAnnotationPath)
                this.annotationData=AnnotationData.fromJsonString(jsonString)
                console.log("aruyo")
                console.log(jsonString)

            }else{
                this.annotationData=new AnnotationData()
                this.annotationData.imageWidth=nextImageData.imageWidth
                this.annotationData.imageHeight=nextImageData.imageHeight
            }

        },
        
        //canvaの画像を選択された画像に変更
        changeImage(index:number){
            const ctx=this.imgCtx

            const base64image=this.imageDataList[index].base64image

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
            if(!this.hoverBoundingBox && this.showDotLine){
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
            clear(this.mainCtx)
        },
        mousedown(e:any){
            if(!this.hoverBoundingBox && !this.makingRectangle){
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
            }
        },
        addBox(point1:IPoint,point2:IPoint){
            const boundingBox=BoundingBox.fromTwoPoints(point1,point2,"テストラベル")
            this.annotationData?.addBoundingBox(boundingBox)
        },
        removeBoundingBox(index:number){
            this.annotationData?.removeBoundingBox(index)
            //TODO:koredeiinoka?
            this.hoverBoundingBox=false
        },
        onClickClass(index:number){
            console.log("class clicked:"+index)
            console.log(this.classes[index])
        },
        getBase64Images(){
            return this.imageDataList.map(x=>x.base64image)
        },
        mouseenterSvgBoundingBox(){
            console.log("mouseenter")
            this.hoverBoundingBox=true
        },
        mouseleaveSvgBoundingBox(){
            console.log("mouseleave")
            this.hoverBoundingBox=false
        },
        mouseoverSvgBoundingBox(){
            console.log(" svg bbox mouseover")
            this.hoverBoundingBox=true
        }
    }
})
</script>