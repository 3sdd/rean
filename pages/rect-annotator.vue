<template>
    <div class="h-screen flex flex-col bg-red-200"
        ref="annotationPage"
        tabindex="0"
    >

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
            <div class="flex-1 bg-purple-300">
                <AnnotationEditor
                    :mainImageBase64="mainImageBase64"
                    :imageData="selectedImageData"
                    :selectedImageIndex="selectedImageIndex"
                    :boundingBoxes="annotationData.boundingBoxes"
                    :selectedBoundingBoxIndex.sync="selectedBoundingBoxIndex"
                    @created-box="boxCreated"
                    @remove-box="removeBoundingBox"
                    @move-bounding-box="moveBoundingBox"
                    @scale-bounding-box="scaleBoundingBox"
                    @update-bounding-boxes="updateBoundingBoxes"
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
            mainImageBase64:"",

            defaultLabel:"",

            annotationData:new AnnotationData(),
            selectedBoundingBoxIndex:-1,//-1は選択されていない状態。
            
        }
    },
    async mounted(){

        const classFilePath:string =this.rootPath+"\\"+"classes.txt"
        const imgRoot:string =this.rootPath+"\\"+"images"

        const classes=await ApiManager.readClasses(classFilePath)
        this.$store.commit("project/loadClasses",classes)

        ApiManager.maximizeWindow()

        const imageFiles=await ApiManager.readdir(imgRoot)


        for(const imgFile of imageFiles){
            const imgPath=imgRoot+"\\"+imgFile
            const imageData=await ApiManager.readImageData(imgPath)

            this.imageDataList.push(imageData)
        }
        this.annotationData=new AnnotationData()
        //画像0番目表示
        this.imageSelected(0)

        //ショートカット登録
        const refAnnotationPage=this.$refs.annotationPage as HTMLElement
        refAnnotationPage.addEventListener("keydown",(e:KeyboardEvent)=>{
            if(e.key==="a"){
                if(this.selectedImageIndex-1<0){
                    alert("最初の画像です。前に戻れません。")
                    return
                }
                this.imageSelected(this.selectedImageIndex-1)
            }else if(e.key==="d"){
                if(this.selectedImageIndex+1>=this.imageDataList.length){
                    alert("最後の画像です。次に進めません。")
                    return
                }
                this.imageSelected(this.selectedImageIndex+1)
            }else if(e.key==="Delete"){
                if(this.selectedImageIndex===-1){
                    return
                }
                this.removeBoundingBox(this.selectedBoundingBoxIndex)
            }
        })

        
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
        selectedImageData():IImageData|null{
            if(this.selectedImageIndex===-1){
                console.log("選択されていない")
                return null
            }
            const d=this.imageDataList[this.selectedImageIndex]
            return d
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
                //TODO:annotationData.boundingBoxesの座標は画像上での座標ではないので、
                //変換する必要がある。


                const annotation=this.annotationData.toJsonString()
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
            this.selectedBoundingBoxIndex=-1
            this.mainImageBase64=this.imageDataList[this.selectedImageIndex].base64image

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
        addBox(point1:IPoint,point2:IPoint){
            const boundingBox=BoundingBox.fromTwoPoints(point1,point2,this.defaultLabel)
            this.annotationData.addBoundingBox(boundingBox)
        },
        removeBoundingBox(index:number){
            this.annotationData.removeBoundingBox(index)
            this.selectedBoundingBoxIndex=-1
        },
        onClickClass(index:number){
            const bboxIndex=this.selectedBoundingBoxIndex
            if(bboxIndex<0){
                return
            }
            console.log("clickedddd")
            console.log(bboxIndex)
            console.log(this.classes[index])
            this.annotationData.setLabel(bboxIndex,this.classes[index])
        },
        getBase64Images(){
            return this.imageDataList.map(x=>x.base64image)
        },
        boxCreated(args:{startPoint:IPoint,endPoint:IPoint}){
            const {startPoint,endPoint}=args
            // console.log("[page]box added (startpoint,endpoint)=")
            // console.log(startPoint)
            // console.log(endPoint)

            this.addBox(startPoint,endPoint)

            this.selectedBoundingBoxIndex=this.annotationData.boundingBoxes.length-1
        },
        moveBoundingBox(index:number,boundingBox:BoundingBox){
            const bbox=this.annotationData.boundingBoxes[index]
            bbox.xmin=boundingBox.xmin
            bbox.ymin=boundingBox.ymin
            bbox.xmax=boundingBox.xmax
            bbox.ymax=boundingBox.ymax
        },
        scaleBoundingBox(index:number,boundingBox:BoundingBox){
            const bbox=this.annotationData.boundingBoxes[index]
            bbox.xmin=boundingBox.xmin
            bbox.ymin=boundingBox.ymin
            bbox.xmax=boundingBox.xmax
            bbox.ymax=boundingBox.ymax
        },
        updateBoundingBoxes(newBoundingBoxes:BoundingBox[]){
            console.log("UPDATE")
            this.annotationData.boundingBoxes=newBoundingBoxes
        }
    }
})
</script>