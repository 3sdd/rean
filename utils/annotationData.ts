import { IPoint } from "./utils"

export class BoundingBox{
    xmin:number
    ymin:number
    xmax:number
    ymax:number

    //TODO:classって名前使えない？
    label:string

    constructor(xmin:number,ymin:number,xmax:number,ymax:number,label:string){
        this.xmin=xmin
        this.ymin=ymin
        this.xmax=xmax
        this.ymax=ymax
        this.label=label
    }
    
    static fromTwoPoints(point1:IPoint,point2:IPoint,label:string){
        const xmin=Math.min(point1.x,point2.x)
        const xmax=Math.max(point1.x,point2.x)
        const ymin=Math.min(point1.y,point2.y)
        const ymax=Math.max(point1.y,point2.y)

        return new BoundingBox(xmin,ymin,xmax,ymax,label)
    }

    getFourPoints():IPoint[]{
        return [
            {x:this.xmin,y:this.ymin},//左上
            {x:this.xmax,y:this.ymin},//右上
            {x:this.xmax,y:this.ymax},//右下
            {x:this.xmin,y:this.ymax}//左下
        ]
    }
}

export class AnnotationData{
    static version="0.1"
    boundingBoxes:BoundingBox[]=[]
    imageWidth:number|null=null//TODO:
    imageHeight:number|null=null//TODO:
    constructor(){
    }

    addBoundingBox(boundingBox:BoundingBox):void{
        this.boundingBoxes.push(boundingBox)
    }
    removeBoundingBox(index:number):void{
        this.boundingBoxes.splice(index,1)
    }

    setLabel(boundingBoxIndex:number,label:string){
        //範囲外
        if(boundingBoxIndex<0 || boundingBoxIndex>=this.boundingBoxes.length){
            console.error(`out of index: bbox index:${boundingBoxIndex} ,bbox indexは0<= bbox index<=:${this.boundingBoxes.length-1}の範囲`)
            return
        }
        this.boundingBoxes[boundingBoxIndex].label=label
    }
    
    //引数のlabelと一致するbounding boxを返す
    findBoundingBoxes(label:string){
        return this.boundingBoxes.filter(x=>x.label===label)
    }


    toJsonString(){
        const json={
            version:AnnotationData.version,
            imageWidth:this.imageWidth,
            imageHeight:this.imageHeight,
            boundingBoxes:this.boundingBoxes,
        }
        return JSON.stringify(json,null,4)
    }
    static fromJsonString(json:string){
        const j=JSON.parse(json)
        const d= new AnnotationData()
        d.imageWidth=j.imageWidth
        d.imageHeight=j.imageHeight
        console.log(j)
        for(const bbox of j.boundingBoxes){
            d.addBoundingBox(new BoundingBox(bbox.xmin,bbox.ymin,bbox.xmax,bbox.ymax,bbox.label))
        }

        return d
    }

}