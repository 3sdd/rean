<template>
    <div class="h-screen flex flex-col bg-red-200">

        <div class="p-2 bg-blue-200">
            <p>残り枚数 10000枚</p>
        </div>
        <div class="flex-1 flex flex-row bg-blue-400 overflow-y-auto">
            <div class="w-60 overflow-y-auto p-1 flex-shrink-0">
                <div class="mx-auto text-center font-bold text-white mb-5">
                    
                </div>
                <ThumbnailViewer 
                    :base64images="getBase64Images()"
                    :selectedImageIndex="selectedImageIndex"
                    @image-clicked="imageSelected"
                >
                </ThumbnailViewer>
            </div>
                <div class="z-80 w-20">
                    canvas size = ({{canvasWidth}}, {{canvasHeight}} )
                    <br><br>
                    annotation size=(
                    {{annotationAreaWidth}},{{annotationAreaHeight}})
                    <br><br>
                    initial svg size=(
                    {{initialSvgWidth}},{{initialSvgHeight}})
                    <br><br>
                    svgScale=
                    {{svgScale.width}},{{svgScale.height}}
                    
                    <br><br>
                    mouse=
                    {{mouseX}},{{mouseY}}
                    <br><br>
                    mouseXSvg,mouseYSvg=
                    {{mouseXSvg}},{{mouseYSvg}}
                </div>
            <div class="flex-1 bg-purple-300">
                <AnnotationEditor
                    :mainImageBase64="mainImageBase64"
                    :imageData="selectedImageData"
                    :selectedImageIndex="selectedImageIndex"
                    :boundingBoxes="bboxes"
                    @created-box="boxCreated"
                    @remove-box="removeBoundingBox"
                ></AnnotationEditor>
            </div>
            <div class="w-48 bg-purple-600 p-2 flex-shrink-0">
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
import { IImageData } from '~/utils/imageData'
import MainImageCanvas from "@/components/MainImageCanvas.vue"

import {ScaleMode} from "@/utils/scaleMode"
import AnnotationEditor from "@/components/AnnotationEditor.vue"

export default Vue.extend({
    components:{
        ClassList,
        ThumbnailViewer,

        MainImageCanvas,

        AnnotationEditor
    },
    data(){
        return {
            imageDataList:[] as Array<IImageData>,
            canvasWidth:700,
            canvasHeight:700,
            mainImageBase64:"",

            mouseX:0,
            mouseY:0,

            svgStyleWidth:0,
            svgStyleHeight:0,

            imgRef:null as Element|null,

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
            },

            annotationAreaWidth:0,
            annotationAreaHeight:0,


            initialSvgWidth:0,
            initialSvgHeight:0,

            mouseXSvg:0,
            mouseYSvg:0
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

            this.imageDataList.push(imageData)
        }
        //画像0番目表示
        this.imageSelected(0)
        
        //リサイズ時の処理


        this.imgRef=this.$refs.editorImage as Element
    },
    computed:{
        projectInfo(){
            return this.$store.state.project.projectInfo as ProjectInfo
        },
        rootPath(){
            const _useTestProject=true
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

        svgScale:function(){

            const width=this.annotationAreaWidth/this.$data.initialSvgWidth
            const height=this.annotationAreaHeight/this.$data.initialSvgHeight

            return {
                width,height
            }
        },

        widthSvgCoordinate(){
            console.log("SVG COORDI")
            const imgRef=this.imgRef
            if(!imgRef){
                return
            }
            const refEditor=this.$refs.annotationEditor as Element
            const rect=refEditor.getBoundingClientRect()
            console.log("WIDTH SVG COORDINATE")
            console.log(this.canvasWidth)
            const top=rect.top
            const left=rect.left
            const bottom=rect.bottom
            const right=rect.right
            console.log("left:",left)
            const topLeftSvg=this.transformPointSvg(left,top)
            const topRightSvg=this.transformPointSvg(right,top)
            console.log("top left ",topLeftSvg)
            console.log("top right ",topRightSvg)
            console.log("top right +offsexx ",topRightSvg+rect.left)
            const svgWidth=topRightSvg.x-topLeftSvg.x
            const out2=this.transformPointSvg(top,right)
            console.log("width svg",svgWidth)
            console.log("width + left",right)
            // console.log("svg width:",out1.y)
            // console.log("out2:",out2)
            return this.transformPointSvg(right,top).x
            // return topRightSvg.x
        },
        heightSvgCoordinate(){
            const out=this.transformPointSvg(this.canvasWidth,this.canvasHeight) 
            return out.y
        },

        selectedImageData():IImageData|null{
            if(this.selectedImageIndex===-1){
                console.log("選択されていない")
                return null
            }
            const d=this.imageDataList[this.selectedImageIndex]
            return d
        },
        bboxes():BoundingBox[]{
            // @ts-ignore
            return this.annotationData?.boundingBoxes ?? []  as Boundingbox[]
        }
    },
    methods:{
        //TODO: selectedImageIndexがこの関数内で indexの値に変更されるようになっている　のをどうにかする
        async imageSelected(index:number){
            const previousSelectedImageIndex=this.selectedImageIndex
            //前の選択画像と次に選択したものが同じものならなにもしない
            if(previousSelectedImageIndex===index){
                return
            }
            const annotationRootPath=this.rootPath+"\\"+"annotations"
            
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

            // const {width:w,height:h}=this.getInitialCanvasSize()
            const w=0,h=0

            this.initialSvgWidth=w
            this.initialSvgHeight=h
            this.canvasWidth=w
            this.canvasHeight=h
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
            this.mouseX=e.clientX
            // this.mouseX=e.clientX
            this.mouseY=e.clientY

            this.mouseXSvg=this.transformPointSvg(e.clientX,e.clientY).x
            this.mouseYSvg=this.transformPointSvg(e.clientX,e.clientY).y
            // this.mouseY=e.clientY

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

        startScaling(index:number,e:any){
            if(this.scaling){
                return
            }
            this.scale={
                isScaling:true,
                index:index,
                mode:e
            }
        },
        getInitialCanvasSize(){
            const targetElem=this.$refs.annotationEditor as Element
            const width=targetElem.clientWidth
            const height=targetElem.clientHeight

            return {width,height}
        },
        transformPointSvg(x:number,y:number):IPoint{
            const svg=this.$refs.editorSvg as SVGSVGElement
            if(!svg){
                return {x:0,y:0}
            }
            const pt=svg.createSVGPoint()
            if(!pt){
                return {x:0,y:0}
            }
            pt.x=x
            pt.y=y

            const svgPoint=pt.matrixTransform(svg.getScreenCTM().inverse())

            return {x:svgPoint.x,y:svgPoint.y}
        },
        boxCreated(args:{startPoint:IPoint,endPoint:IPoint}){
            const {startPoint,endPoint}=args
            console.log("box added")
            console.log(startPoint)
            console.log(endPoint)

            this.addBox(startPoint,endPoint)

            console.log(this.annotationData?.boundingBoxes)
        },
    }
})
</script>