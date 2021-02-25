<template>
    <div class="bg-red-500 flex justify-center items-center relative w-full h-full"
        ref="annotationEditor"
    >
        <div class="z-10 absolute">
            <img :src="mainImageBase64" class="pointer-events-none" 
                ref="editorImage"
                :width="imageElementWidth" :height="imageElementHeight"
            />
        </div>
        <div class="z-20 absolute">
        <svg :width="imageElementWidth" :height="imageElementHeight"
            :viewBox="`0 0 ${imageElementWidth} ${imageElementHeight}`" 
            preserveAspectRatio="xMinYMin"
            xmlns="http://www.w3.org/2000/svg"
            style="background-color:rgba(255,255,0,0.5);"
            :key="selectedImageIndex"
            ref="editorSvg"

            @mousedown="mousedown"
            @mouseup="mouseup"
            @mousemove="mousemove"
            @mouseenter="mouseenter"
            @mouseleave="mouseleave"
        >
            <circle :cx="0" :cy="0" r="10" fill="black"></circle>
            <circle :cx="imageElementWidth" :cy="imageElementHeight" r="10" fill="red"></circle>

            <SvgCrossLine class="cursor-event-none"
                :cx="svgMouseX" :cy="svgMouseY"
                :width="imageElementWidth" :height="imageElementHeight"
                :show="showDotLine"
            ></SvgCrossLine>
            <SvgPreviewBox
                :show="makingBox"
                :x1="previewBoxStartPoint.x" :y1="previewBoxStartPoint.y"
                :x2="svgMouseX" :y2="svgMouseY"
            ></SvgPreviewBox>
            <text :x="10" :y="20">{{svgMouseX}},{{svgMouseY}}</text>
            <text :x="10" :y="70">{{makingBox}},{{hoverBoundingBox}}</text>
            <g
                @mouseenter="mouseenterBoundingBox"
                @mouseleave="mouseleaveBoundingBox"
                @mouseover="mouseoverBoundingBox"
                ref="bboxContainer"
            >
                <SvgBoundingBox
                    v-for="(bbox,i) in svgCoordinateBoundingBoxes" :key="'bbox_'+i"
                    :isSelected="i===selectedBoundingBoxIndex"
                    :xmin.sync="bbox.xmin" :ymin.sync="bbox.ymin" 
                    :xmax.sync="bbox.xmax" :ymax.sync="bbox.ymax"
                    :label="bbox.label"
                    :showRemoveButton="true"
                    @click-bounding-box="selectedBoundingBoxIndex=i"
                    @remove="removeBoundingBox(i)"
                    @start-scale="startScaling(i,$event)"
                >
                </SvgBoundingBox>
            </g>
        </svg>
        </div>
    </div>
</template>

<script lang="ts">
import Vue, {PropType} from 'vue'
import { IImageData } from '~/utils/imageData'
import SvgCrossLine from "@/components/SvgCrossLine.vue"
import SvgPreviewBox from "@/components/SvgPreviewBox.vue"
import SvgBoundingBox from "@/components/SvgBoundingBox.vue"
import { BoundingBox } from '~/utils/annotationData'
import { IPoint } from '~/utils/utils'
import { ScaleMode } from '~/utils/scaleMode'

export default Vue.extend({
    components:{
        SvgCrossLine,
        SvgPreviewBox,
        SvgBoundingBox,
    },
    props:{
        mainImageBase64:{
            type:String,
            required:true,
        },
        imageData:{
            type:Object as PropType<IImageData|null>,
            required:false,
            default:null
        },
        selectedImageIndex:{//TODO:keyとして使ってるだけ？いらない？
            type:Number,
            required:true,
        },
        boundingBoxes:{
            type:Array as PropType<BoundingBox[]>,
            required:true
        },


    },
    data(){
        return {
            showDotLine:false,

            refAnnotationEditor:null as Element|null,

            resizeKey:0,//リサイズするたぶにcomputedのimageElementWidth,heightを更新したので、更新用のキー
            
            svgMouseX:0,//サポート線の表示に使う マウス位置 x
            svgMouseY:0, //サポート線の表示に使う マウス位置　y

            makingBox:false,
            previewBoxStartPoint:{x:0,y:0},

            hoverBoundingBox:false,

            selectedBoundingBoxIndex:-1,

            initialWidth:0,
            initialHeight:0,

            scale:{
                isScaling:false,
                index:-1,
                mode:"" as ScaleMode|null
            },
        }
    },
    watch:{
        imageData(){
            this.initialWidth=this.imageElementWidth
            this.initialHeight=this.imageElementHeight
            console.log("imageDATA Changed ,w,h=",this.initialWidth+","+this.initialHeight)

        }
    },
    mounted(){
        console.log("MOUTED  annotation editor")
        //リサイズ時の処理
        this.resizeKey=0
        window.addEventListener("resize",this.onResize)
        this.onResize()

        this.refAnnotationEditor=this.$refs.annotationEditor as Element
        //TODO:editorの形に収まるようなサイズにする 。現在は画像サイズそのまま
        // @ts-ignore
        console.log(this.calculateImageElementSize())
        console.log(this.imageElementWidth)
        console.log(this.imageElementHeight)

        this.initialWidth=this.imageElementWidth
        this.initialHeight=this.imageElementHeight
    },
    computed:{
        imageElementWidth(){
            if(!this.imageData){
                return 0
            }
            //関数でこのcomputdの値を再計算したので、resizeKeyの値を参照して、数字を上げていくことで強制更新
            this.resizeKey //TODO:computedを関数から強制的に更新する方法ない？？

            // @ts-ignore
            const c=this.calculateImageElementSize(this.imageData.imageWidth,this.imageData.imageHeight)
            return c.width
        },
        imageElementHeight(){
            if(!this.imageData){
                return 0
            }
            this.resizeKey//TODO:computedを関数から強制的に更新する方法ない？？

            // @ts-ignore
            const c=this.calculateImageElementSize(this.imageData.imageWidth,this.imageData.imageHeight)
            return c.height
        },
        //実際の表示にあるようにキャンバスの大きさに合わせてスケールする
        svgCoordinateBoundingBoxes(){
            const bboxes=[] as BoundingBox[]
            const xratio=this.imageElementWidth/this.initialWidth　//横の比率
            const yratio=this.imageElementHeight/this.initialHeight //縦の比率
            for(const bbox of this.boundingBoxes){
                const pmin={x:bbox.xmin,y:bbox.ymin}
                const pmax={x:bbox.xmax,y:bbox.ymax}
                console.log(pmin.x,pmin.y,pmax.x,pmax.y)
                console.log([xratio,yratio])
                const xmin=pmin.x*xratio
                const ymin=pmin.y*yratio
                const xmax=pmax.x*xratio
                const ymax=pmax.y*yratio
                console.log([xmin,ymin,xmax,ymax])
                bboxes.push(new BoundingBox(xmin,ymin,xmax,ymax,bbox.label))
            }
            return bboxes
        }
    },

    methods:{
        mouseenter(e:MouseEvent){
            this.showDotLine=true
            console.log("[mouseenter]")
        },
        mouseleave(e:MouseEvent){
            this.showDotLine=false
        },
        mousemove(e:MouseEvent){
            this.svgMouseX=e.offsetX
            this.svgMouseY=e.offsetY

            this.scaleMain(e)
        },
        mousedown(e:MouseEvent){
            if(!this.hoverBoundingBox && !this.makingBox){
                this.makingBox=true
                this.previewBoxStartPoint={
                    x:e.offsetX,y:e.offsetY
                }
                console.log("start creating box")
                console.log(this.previewBoxStartPoint)
            }
        },
        mouseup(e:MouseEvent){
            if(this.makingBox){
                this.makingBox=false
                //bounding boxの選択解除
                const numBboxes=this.boundingBoxes.length

                //親側でbounding boxに追加する
                this.$emit("created-box",{
                    startPoint:{x:this.previewBoxStartPoint.x,
                                y:this.previewBoxStartPoint.y},
                    endPoint:{x:e.offsetX, y:e.offsetY}
                })
                //TODO:this.selectedBoundingBoxIndex=numBboxes-1にしても、選択状態にならない
                // emitっていつ実行されるの？

            }
            //スケールしているなら解除
            if(this.scale.isScaling){
                this.scale={
                    isScaling:false,
                    index:-1,
                    mode:null,
                }
            }
        },

        mouseenterBoundingBox(){
            this.hoverBoundingBox=true
        },
        mouseleaveBoundingBox(){
            this.hoverBoundingBox=false
        },
        mouseoverBoundingBox(){
            this.hoverBoundingBox=true
        },


        onResize(){
            this.resizeKey++
            console.log("resize")
        },
        calculateImageElementSize(imageWidth:number,imageHeight:number){
            console.log("[calculate]")
            if(!this.refAnnotationEditor){
                return {width:0,height:0}
            }
            const editorElem=this.refAnnotationEditor

            //TODO:targetElem.getClientRect()はwidth,heightはエディター全体の大きさなので、画像サイズは、
            //TODO: その全体のwidth,heightどちらかにぴったりとひっついて収まるような大きさなので、その値を求める
            const editorRect=editorElem.getBoundingClientRect()
            const editorWidth=editorRect.width
            const editorHeight=editorRect.height

            console.log("[calculate] editor (w,h)=",editorWidth+","+editorHeight)

            let imgWidth=0
            let imgHeight=0
            
            const actualImgWidth=imageWidth
            const actualImgHeight=imageHeight


            if(actualImgWidth>actualImgHeight){
                imgWidth=editorWidth

                const wRatio=editorWidth/actualImgWidth
                imgHeight=actualImgHeight*wRatio
                console.log("[calculate]imagewidth>imageHeight")
                console.log("[calculate]wratio:",wRatio)
                console.log(`(w,h):${actualImgWidth},${actualImgHeight} => ${imgWidth},${imgHeight}`)

                //TODO:変更後のheight>editorHeightの場合
                if(imgHeight>editorHeight){
                    console.log(">>>>")
                    const hRatio=editorHeight/imgHeight
                    imgHeight=editorHeight
                    imgWidth=imgWidth*hRatio
                    console.log("[calculate]hratio:",hRatio)
                    console.log("[calaculate]img w,h=",imgWidth+","+imgHeight)
                }
            }else{
                imgHeight=editorHeight

                const hRatio=editorHeight/actualImgHeight
                imgWidth=actualImgWidth*hRatio
                console.log("[calculate]imagewidth<imageHeight")
                console.log("[calculate]hratio:",hRatio)
                console.log(`(w,h):${actualImgWidth},${actualImgHeight} => ${imgWidth},${imgHeight}`)
                //TODO:変更後のwidth>editorWidthの場合

                if(imgWidth>editorWidth){
                    console.log(">>>>>+")
                    const wRatio=editorWidth/imgWidth
                    imgWidth=editorWidth
                    imgHeight=imgHeight*wRatio
                }
            }

            return {width:imgWidth,height:imgHeight}
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
            // @ts-ignore
            const svgPoint=pt.matrixTransform(svg.getScreenCTM().inverse())

            return {x:svgPoint.x,y:svgPoint.y}
        },
        removeBoundingBox(index:number){
            //選択解除
            this.selectedBoundingBoxIndex=-1
            this.hoverBoundingBox=false

            this.$emit("remove-box",index)
        },
        startScaling(index:number,e:any){
            if(this.scale.isScaling){
                return
            }
            this.scale={
                isScaling:true,
                index:index,
                mode:e
            }
        },
        scaleMain(e:MouseEvent){
            if(this.scale.isScaling){
                const bb=this.boundingBoxes[this.scale.index]
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
        }
    }
})
</script>