<template>
    <div class="h-screen flex flex-col bg-red-200">

        <div class="p-2 bg-blue-200">
            <p>残り枚数 10000枚</p>
        </div>
        <div class="flex-1 flex flex-row bg-blue-400 h-full">
            <div class="w-40 h-ful overflow-y-auto p-1">
                <div class="mx-auto text-center font-bold text-white mb-5">
                    
                </div>
                <ThumbnailViewer 
                    :base64images="getBase64Images()"
                    :selectedImageIndex="selectedImageIndex"
                    @image-clicked="imageSelected"
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
                <div>
                    {{selectedBoundingBox}}
                </div>
                <div class="bg-green-300 flex justify-center items-center relative">
                    <MainImageCanvas 
                        class="absolute z-10 pointer-events-none"
                        :canvasWidth="canvasWidth"
                        :canvasHeight="canvasHeight"
                        :base64Image="mainImageBase64"
                    ></MainImageCanvas>
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
                        <SvgCrossLine class="cursor-event-none"
                            :cx="mouseX" :cy="mouseY"
                            :width="canvasWidth" :height="canvasHeight"
                            :show="showDotLine"
                        ></SvgCrossLine>
                        <SvgPreviewBox
                            :show="makingRectangle"
                            :x1="rectangle.point1.x" :y1="rectangle.point1.y"
                            :x2="mouseX" :y2="mouseY"
                        ></SvgPreviewBox>
                        <g v-if="annotationData!==null" 
                            @mouseenter="mouseenterSvgBoundingBox"
                            @mouseleave="mouseleaveSvgBoundingBox"
                            @mouseover="mouseoverSvgBoundingBox"
                            ref="bboxContainer"
                        >
                            <SvgBoundingBox
                                v-for="(bbox,i) in annotationData.boundingBoxes" :key="'bbox_'+i"
                                :isSelected="i===selectedBoundingBox"
                                :xmin.sync="bbox.xmin" :ymin.sync="bbox.ymin" 
                                :xmax.sync="bbox.xmax" :ymax.sync="bbox.ymax"
                                :label="bbox.label"
                                :showRemoveButton="true"
                                @click-bounding-box="clickBoundingBox(i)"
                                @remove="removeBoundingBox(i)"
                                @start-scale="startScaling(i,$event)"
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
import MainImageCanvas from "@/components/MainImageCanvas.vue"
import SvgCrossLine from "@/components/SvgCrossLine.vue"
import SvgPreviewBox from "@/components/SvgPreviewBox.vue"
import {ScaleMode} from "@/utils/scaleMode"

export default Vue.extend({
    components:{
        ClassList,
        ThumbnailViewer,

        SvgBoundingBox,
        MainImageCanvas,
        SvgCrossLine,
        SvgPreviewBox
    },
    data(){
        return {
            imageDataList:[] as Array<IImageData>,
            canvasWidth:800,
            canvasHeight:800,
            mainImageBase64:"",

            showDotLine:false,
            mouseX:0,
            mouseY:0,

            makingRectangle:false,
            defaultLabel:"",

            rectangle:{
                point1:{x:0,y:0},
                point2:{x:0,y:0}
            },
            annotationData:null as AnnotationData|null,
            hoverBoundingBox:false,
            selectedBoundingBox:-1,//-1は選択されていない状態。

            scaling:false,
            scale:{
                isScaling:false,
                index:-1,
                mode:"" as ScaleMode|null
            }
        }
    },
    async mounted(){


        const classFilePath:string =this.rootPath+"\\"+"classes.txt"
        const imgRoot:string =this.rootPath+"\\"+"images"

        const classes=await ApiManager.readClasses(classFilePath)
        this.$store.commit("project/loadClasses",classes)

        ApiManager.maximizeWindow()

        const imageFiles=await ApiManager.readdir(imgRoot)

        this.annotationData=new AnnotationData()

        for(const imgFile of imageFiles){
            const imgPath=imgRoot+"\\"+imgFile
            const imageData=await ApiManager.readImageData(imgPath)
            console.log(imageData)

            this.imageDataList.push(imageData)
        }
        //画像0番目表示
        this.imageSelected(0)
        
    },
    computed:{
        projectInfo(){
            return this.$store.state.project.projectInfo as ProjectInfo
        },
        rootPath(){
            const _useTestProject=false
            if(_useTestProject){
                return "./TestProject"
            }
            return (this.$store.state.project.projectInfo as ProjectInfo).location
        },
        classes():string[]{
            return this.projectInfo.classes
        },
        selectedImageIndex():number{
            return this.projectInfo.selectedImageIndex
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
            const annotationRootPath=this.projectInfo.location+"\\"+"annotations"
            
            //アノテーションデータを保存する (前の画像があるとき)

            if(previousSelectedImageIndex!==-1){  //前の選択画像があるとき
                //TODO:アノテーションファイルのパスの取得関数欲しい
                const filename=this.imageDataList[previousSelectedImageIndex].filename
                const annotationPath=annotationRootPath+"\\"+`${filename}.json`
                //アノテーションのフォルダがない時はアラートを表示する
                if(! (await ApiManager.existsPath(annotationRootPath))){
                    alert("アノテーションフォルダーがありません。\nフォルダーを作成してください。\n"+annotationRootPath)
                    return
                }
                const annotation=this.annotationData?.toJsonString()
                console.log(annotation)
                if(this.annotationData===null){
                    console.error("no annotation data")
                }
                //ラベルを付けていないbounding boxがあるときはアラートを表示する
                if(this.annotationData){
                    const existsNoLabelBoundingBox=this.annotationData
                        .findBoundingBoxes(this.defaultLabel).length >0
                    if(existsNoLabelBoundingBox){
                        alert("ラベルを付けていないBounding Boxが存在します。\nラベルを付けてください")
                        return
                    }

                }
                ApiManager.writeFile(annotationPath,annotation)
            }

            //次の画像に変える
            this.$store.commit("project/updateSelectedImage",index)

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
            this.mainImageBase64=this.imageDataList[index].base64image
        },
        mousemove(e:MouseEvent){
            // const ctx=this.mainCtx
            // clear(ctx)
            // const x=e.offsetX
            // const y=e.offsetY
            // if(!this.hoverBoundingBox && this.showDotLine){
            //     ctx.strokeStyle="gray"
            //     drawCrossLine(ctx,x,y)
            // }

            // if(this.makingRectangle){
            //     ctx.setLineDash([])
            //     ctx.strokeStyle="black"
            //     drawBox(ctx,this.rectangle.point1,{x,y})
            // }else if(this.scaling){
            //     console.log("P scaling")
            // }
            this.mouseX=e.offsetX
            this.mouseY=e.offsetY
            
            if(this.scale.isScaling){
                const bb=this.annotationData?.boundingBoxes[this.scale.index]
                if(bb){
                    const mode=this.scale.mode
                    if(mode==="right"){
                        bb.xmax=e.offsetX
                    }else if(mode==="left"){
                        bb.xmin=e.offsetX
                    }else if(mode==="up"){
                        bb.ymin=e.offsetY
                    }else if(mode==="down"){
                        bb.ymax=e.offsetY
                    }else if(mode==="upper-left"){
                        bb.xmin=e.offsetX
                        bb.ymin=e.offsetY
                    }else if(mode==="upper-right"){
                        bb.xmax=e.offsetX
                        bb.ymin=e.offsetY
                    }else if(mode==="lower-right"){
                        bb.xmax=e.offsetX
                        bb.ymax=e.offsetY
                    }else if(mode==="lower-left"){
                        bb.xmin=e.offsetX
                        bb.ymax=e.offsetY
                    }
                }
            }

        },
        mouseenter(e:MouseEvent){
            this.showDotLine=true
        },
        mouseleave(e:MouseEvent){
            this.showDotLine=false
        },
        mousedown(e:MouseEvent){
            if(!this.hoverBoundingBox && !this.makingRectangle){
                this.makingRectangle=true
                const x=e.offsetX
                const y=e.offsetY
                this.rectangle.point1.x=x
                this.rectangle.point1.y=y
                this.rectangle.point2.x=x
                this.rectangle.point2.y=y
            }

        },
        mouseup(e:MouseEvent){
            console.log("mouseup")
            if(this.makingRectangle){
                this.makingRectangle=false
                const x=e.offsetX
                const y=e.offsetY

                this.rectangle.point2.x=x
                this.rectangle.point2.y=y

                this.addBox(this.rectangle.point1,this.rectangle.point2)
                const numBboxes=this.annotationData?.boundingBoxes?.length
                if(numBboxes){
                    this.selectedBoundingBox=numBboxes-1 //最後を選択
                }
            }if(this.scale.isScaling){
                this.scale={
                    isScaling:false,
                    index:-1,
                    mode:null,
                }
            }
        },
        addBox(point1:IPoint,point2:IPoint){
            const boundingBox=BoundingBox.fromTwoPoints(point1,point2,this.defaultLabel)
            this.annotationData?.addBoundingBox(boundingBox)
        },
        removeBoundingBox(index:number){
            this.annotationData?.removeBoundingBox(index)
            if(this.selectedBoundingBox===index){
                this.selectedBoundingBox=-1
            }
            //TODO:koredeiinoka?
            this.hoverBoundingBox=false
        },
        clickBoundingBox(index:number){
            this.selectedBoundingBox=index
            console.log("selected bounding box index:"+this.selectedBoundingBox)
        },
        onClickClass(index:number){
            const bboxIndex=this.selectedBoundingBox
            if(bboxIndex<0){
                return
            }
            this.annotationData?.setLabel(bboxIndex,this.classes[index])
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
        },
        startScaling(index:number,e:any){
            if(this.scaling){
                return
            }
            console.log("parent s")
            console.log(index)
            console.log(e)
            this.scale={
                isScaling:true,
                index:index,
                mode:e
            }
        },
    }
})
</script>