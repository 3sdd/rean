
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
}

export class AnnotationData{
    static version="0.1"
    boundingBoxes=[] as BoundingBox[]

    constructor(){
    }

    addBoundingBox(boundingBox:BoundingBox):void{
        this.boundingBoxes.push(boundingBox)
    }


    toJson(){
        const json={
            version:AnnotationData.version,
            boundingBoxes:this.boundingBoxes,
            imageWidth:null, //TODO:
            imageHeight:null,//TODO:
        }
        return JSON.stringify(json,null,4)
    }

}