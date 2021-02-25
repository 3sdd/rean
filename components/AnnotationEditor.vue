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
        <!-- <svg :width="svgStyleWidth" :height="svgStyleHeight"
            :viewBox="`0 0 ${initialSvgWidth} ${initialSvgHeight}`" 
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
            <circle :cx="mouseXSvg" :cy="mouseYSvg" r="10" fill="black"></circle>
            <SvgCrossLine class="cursor-event-none"
                :cx="mouseXSvg" :cy="mouseYSvg"
                :width="widthSvgCoordinate" :height="heightSvgCoordinate"
                :show="showDotLine"
            ></SvgCrossLine>
            <SvgPreviewBox
                :show="makingRectangle"
                :x1="rectangle.point1.x" :y1="rectangle.point1.y"
                :x2="mouseXSvg" :y2="mouseYSvg"
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
        </svg> -->
        </div>
    </div>
</template>

<script lang="ts">
import Vue, {PropType} from 'vue'
import { IImageData } from '~/utils/imageData'
export default Vue.extend({
    props:{
        mainImageBase64:{
            type:String,
            required:true,
        },
        imageData:{
            type:Object as PropType<IImageData|null>,
            required:false,
            default:null
        }

    },
    data(){
        return {
            showDotLine:false,

            refAnnotationEditor:null as Element|null,

            resizeKey:0,//リサイズするたぶにcomputedのimageElementWidth,heightを更新したので、更新用のキー
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
        },
        mouseleave(e:MouseEvent){
            this.showDotLine=false
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