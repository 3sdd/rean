
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
    
    static fromTwoPoints(point1:{x:number,y:number},point2:{x:number,y:number},label:string){
        const xmin=Math.min(point1.x,point2.x)
        const xmax=Math.max(point1.x,point2.x)
        const ymin=Math.min(point1.y,point2.y)
        const ymax=Math.max(point1.y,point2.y)

        return new BoundingBox(xmin,ymin,xmax,ymax,label)
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


    toJsonString(){
        const json={
            version:AnnotationData.version,
            boundingBoxes:this.boundingBoxes,
            imageWidth:null, //TODO:
            imageHeight:null,//TODO:
        }
        return JSON.stringify(json,null,4)
    }
    static fromJsonString(json:string){
        const j=JSON.parse(json)
        const d= new AnnotationData()
        console.log(j)
        for(const bbox of j.boundingBoxes){
            d.addBoundingBox(new BoundingBox(bbox.xmin,bbox.ymin,bbox.xmax,bbox.ymax,bbox.label))
        }

        return d
    }

}