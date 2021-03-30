<template>
    <div class="h-screen flex flex-col bg-gray-600"
        ref="annotationPage"
        tabindex="0"
    >
        <div class="p-1 bg-gray-300 flex">
            <div @click="exportData()" class="border-2 p-1 hover:bg-gray-200">
                export
            </div>
        </div>
        <div class="flex-1 flex flex-row overflow-y-auto bg-white">
            <div class="w-60 overflow-y-auto p-1 flex-shrink-0 border-r-2 border-gray-400">
                <div class="mx-auto text-center font-bold text-black mb-5 text-lg border-2">
                    <div>
                        {{selectedImageIndex+1}}<span class="text-xs ml-1">枚目</span>
                        <span class="mx-1">/</span>
                        {{totalNumImages}}<span class="text-xs ml-1">枚</span>
                    </div>
                </div>
                <ThumbnailViewer 
                    :base64images="getBase64Images()"
                    :selectedImageIndex="selectedImageIndex"
                    @image-clicked="imageSelected"
                >
                </ThumbnailViewer>
            </div>
            <div>
                <div class="w-full">
                    <div>
                        拡大
                    </div>
                    <div class="grid grid-cols-2">
                        <div @click="expand('upper-left')" class="border-2 border-blue-300 w-7 h-7 flex justify-center items-center hover:bg-blue-50">
                            ┌
                        </div>
                        <div @click="expand('upper-right')" class="border-2 border-blue-300 w-7 h-7 flex justify-center items-center hover:bg-blue-50">
                            ┐
                        </div>
                        <div @click="expand('lower-left')" class="border-2 border-blue-300 w-7 h-7 flex justify-center items-center hover:bg-blue-50">
                            └
                        </div>
                        <div @click="expand('lower-right')" class="border-2 border-blue-300 w-7 h-7 flex justify-center items-center hover:bg-blue-50">
                            ┘
                        </div>
                    </div>
                </div>
            </div>
            <div class="flex-1 bg-gray-700">

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
            <div class="w-48 p-2 flex-shrink-0 bg-white">
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
        console.log(this.projectInfo)
        const classFilePath:string =await ApiManager.resolvePath(this.rootPath,this.projectInfo.classPath)
        const imgRoot:string =await ApiManager.resolvePath(this.rootPath,this.projectInfo.imagePath)

        const classes=await ApiManager.readClasses(classFilePath)
        this.$store.commit("project/loadClasses",classes)

        ApiManager.maximizeWindow()

        const imageFiles=await ApiManager.readdir(imgRoot)


        for(const imgFile of imageFiles){
            const imgPath=await ApiManager.joinPath(imgRoot,imgFile)
            const imageData=await ApiManager.readImageData(imgPath)

            this.imageDataList.push(imageData)
        }
        this.annotationData=new AnnotationData()
        //画像0番目表示
        this.imageSelected(0)

        //ショートカット登録
        const refAnnotationPage=this.$refs.annotationPage as HTMLElement
        refAnnotationPage.addEventListener("keydown",async (e:KeyboardEvent)=>{
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
            }else if(e.ctrlKey && e.key==="s"){
                try{
                    //async function
                    await this.saveAnnotation(this.selectedImageIndex)
                    alert("アノテーションデータを保存しました")
                }catch(e){
                    alert(e)
                    return
                }
            }
        })

        
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
        selectedImageData():IImageData|null{
            if(this.selectedImageIndex===-1){
                // console.log("選択されていない")
                return null
            }
            const d=this.imageDataList[this.selectedImageIndex]
            return d
        },
        totalNumImages(){
            const numImages= this.imageDataList.length as number
            return numImages
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
                // //TODO:アノテーションファイルのパスの取得関数欲しい
                // const filename=this.imageDataList[previousSelectedImageIndex].filename
                // const annotationPath=annotationRootPath+"\\"+`${filename}.json`
                // //アノテーションのフォルダがない時はアラートを表示する
                // if(! (await ApiManager.existsPath(annotationRootPath))){
                //     alert("アノテーションフォルダーがありません。\nフォルダーを作成してください。\n"+annotationRootPath)
                //     return
                // }
                // //TODO:annotationData.boundingBoxesの座標は画像上での座標ではないので、
                // //変換する必要がある。


                // const annotation=this.annotationData.toJsonString()
                // // console.log(annotation)
                // if(this.annotationData===null){
                //     console.error("no annotation data")
                // }
                // //ラベルを付けていないbounding boxがあるときはアラートを表示する
                // if(this.annotationData){
                //     const existsNoLabelBoundingBox=this.annotationData
                //         .findBoundingBoxes(this.defaultLabel).length >0
                //     if(existsNoLabelBoundingBox){
                //         alert("ラベルを付けていないBounding Boxが存在します。\nラベルを付けてください")
                //         return
                //     }

                // }
                // ApiManager.writeFile(annotationPath,annotation)
                try{
                    await this.saveAnnotation(previousSelectedImageIndex)
                }catch(e){
                    alert(e)
                    return
                }
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
                // console.log("aruyo")
                // console.log(jsonString)

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
            // console.log("clickedddd")
            // console.log(bboxIndex)
            // console.log(this.classes[index])
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
            // console.log("UPDATE")
            this.annotationData.boundingBoxes=newBoundingBoxes
        },

        async saveAnnotation(index:number){
            //TODO:アノテーションファイルのパスの取得関数欲しい
            const filename=this.imageDataList[index].filename

            const annotationRootPath=await ApiManager.resolvePath(this.projectInfo.location,this.projectInfo.annotationPath)
            const annotationPath=await ApiManager.joinPath(annotationRootPath,`${filename}.json`)
            //アノテーションのフォルダがない時はアラートを表示する
            if(! (await ApiManager.existsPath(annotationRootPath))){
                // alert("アノテーションフォルダーがありません。\nフォルダーを作成してください。\n"+annotationRootPath)
                throw new Error("アノテーションフォルダーがありません。\nフォルダーを作成してください。\n"+annotationRootPath)
                // return
            }
            //TODO:annotationData.boundingBoxesの座標は画像上での座標ではないので、
            //変換する必要がある。


            const annotation=this.annotationData.toJsonString()
            // if(this.annotationData===null){
            //     console.error("no annotation data")
            // }
            //ラベルを付けていないbounding boxがあるときはアラートを表示する
            if(this.annotationData){
                const existsNoLabelBoundingBox=this.annotationData
                    .findBoundingBoxes(this.defaultLabel).length >0
                if(existsNoLabelBoundingBox){
                    // alert("ラベルを付けていないBounding Boxが存在します。\nラベルを付けてください")
                    throw new Error("ラベルを付けていないBounding Boxが存在します。\nラベルを付けてください")
                    // return
                }

            }

            if(this.annotationData.imageWidth===-1 || this.annotationData.imageHeight===-1){
                alert("アノテーションデータにおかしい値があります。\n修正してください。\nimage width ===-1 or image height===-1")
                return
            }
            ApiManager.writeFile(annotationPath,annotation)
        },
        expand(type:"upper-left"|"lower-left"|"upper-right"|"lower-right"){
            const bboxIndex=this.selectedBoundingBoxIndex
            if(bboxIndex===-1){
                return
            }
            console.log(this.annotationData)
            const bbox=this.annotationData.boundingBoxes[bboxIndex]

            const xmax=this.annotationData.imageWidth
            const ymax=this.annotationData.imageHeight

            if(xmax===-1 || ymax===-1){
                throw new Error(`annotation data : image width or height ===-1(imageWidth=${xmax},imageHeight=${ymax})`)
            }

            switch(type){
                case "upper-left":                
                    bbox.xmin=0
                    bbox.ymin=0
                    break
                case "lower-left":
                    bbox.xmin=0
                    bbox.ymax=ymax
                    break
                case "upper-right":
                    bbox.xmax=xmax
                    bbox.ymin=0
                    break
                case "lower-right":
                    bbox.xmax=xmax
                    bbox.ymax=ymax
                    break
            }
        },
        async exportData(){
            // alert("エクスポート機能はまだ実装されていません")
            const exportPath=await ApiManager.resolvePath(this.projectInfo.location,this.projectInfo.exportPath)
            const existsExportPath=await ApiManager.existsPath(exportPath)
            if(existsExportPath){
                alert("エクスポート先がすでに存在しています。\n"+exportPath)
                return
            }
            ApiManager.mkdir(exportPath)

            //imagesフォルダーと画像をコピー
            const srcImgDir=await ApiManager.resolvePath(this.projectInfo.location,this.projectInfo.imagePath)
            const imgDirPath=await ApiManager.joinPath(exportPath,"images")
            await ApiManager.mkdir(imgDirPath)

            
            //画像のコピーと
            //annotation.json作成
            const annoPath=await ApiManager.joinPath(exportPath,"annotation.json")

            const data=[]
            for(let i=0;i<this.imageDataList.length;i++){
                const imgData=this.imageDataList[i]
                const imgFilename=imgData.filename

                //アノテーション存在チェック
                const annoFilename=imgFilename+".json"
                const annoPath=await ApiManager.resolvePath(this.projectInfo.location,this.projectInfo.annotationPath,annoFilename)
                const existsAnno=await ApiManager.existsPath(annoPath)
                if(!existsAnno){
                    continue
                }
                //画像をexportへコピー
                const srcImgPath=await ApiManager.joinPath(srcImgDir,imgFilename)
                const dstImgPath=await ApiManager.joinPath(imgDirPath,imgFilename)
                await ApiManager.copyFile(srcImgPath,dstImgPath)

                //アノテーション情報をexport
                const annojsonstr=await ApiManager.readFile(annoPath)
                const annoJson=JSON.parse(annojsonstr)
                // alert(annojson)

                const bboxes=[]
                for(const bbox of annoJson.boundingBoxes){
                    bboxes.push({
                        "xmin":bbox.xmin,
                        "ymin":bbox.ymin,
                        "xmax":bbox.xmax,
                        "ymax":bbox.ymax,
                        "label":bbox.label
                    })
                }
                data.push({
                    "version":"0.1",
                    "imageWidth":imgData.imageWidth,
                    "imageHeight":imgData.imageHeight,
                    "imageFilename":imgFilename,
                    "annotationFilename":annoFilename,
                    "boundingBoxes":bboxes,
                })
            }
            const annotationObj={
                data
            }
            const annotationJson=JSON.stringify(annotationObj,null,4)
            await ApiManager.writeFile(annoPath,annotationJson)


            //class.txt作成
            const classPath=await ApiManager.joinPath(exportPath,"class.txt")
            const classesText=this.projectInfo.classes.join("\n")
            await ApiManager.writeFile(classPath,classesText)

            // TODO:exportフォルダーをzipにしたexport.zipを作成してexportフォルダーに入れる

            alert("エクスポート完了")


        }
    }
})
</script>