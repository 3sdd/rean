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
            <g>
                <circle 
                    v-for="(bbox,i) in boundingBoxes" :key="'bbox_'+i"
                    :cx="10" :cy="10+i*20" r="10" fill="blue">
                </circle>
                <circle  v-for="(bbox,i) in boundingBoxes" :key="'bbox_'+i" :x="10+100*i" :y="30" r="10" filled="blue"></circle>           
            </g>
            <g
                @mouseenter="mouseenterBoundingBox"
                @mouseleave="mouseleaveBoundingBox"
                @mouseover="mouseoverBoundingBox"
                ref="bboxContainer"
            >
                <SvgBoundingBox
                    v-for="(bbox,i) in boundingBoxes" :key="'bbox_'+i"
                    :isSelected="i===selectedBoundingBox"
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
        selectedBoundingBoxIndex:{
            type:Number,
            required:false,
            default:-1,
        }

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


                this.$emit("created-box",{
                    startPoint:{x:this.previewBoxStartPoint.x,
                                y:this.previewBoxStartPoint.y},
                    endPoint:{x:e.offsetX, y:e.offsetY}
                })
            }
            // console.log("mouseup")
            // if(this.makingRectangle){
            //     this.makingRectangle=false
            //     const x=e.offsetX
            //     const y=e.offsetY

            //     this.rectangle.point2.x=x
            //     this.rectangle.point2.y=y

            //     this.addBox(this.rectangle.point1,this.rectangle.point2)
            //     const numBboxes=this.annotationData?.boundingBoxes?.length
            //     if(numBboxes){
            //         this.selectedBoundingBox=numBboxes-1 //最後を選択
            //     }
            // }if(this.scale.isScaling){
            //     this.scale={
            //         isScaling:false,
            //         index:-1,
            //         mode:null,
            //     }
            // }
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
        calculateImageElementSize(imageWidth:number,imageHeight:number):{width:number,height:number}{
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
        }
    }
})
</script>