import { BoundingBox } from "./annotationData"


export function drawBoundingBox(ctx:CanvasRenderingContext2D,boundingBox:BoundingBox,lineWidth=3){
    ctx.strokeStyle="red"

    const xmin=boundingBox.xmin
    const ymin=boundingBox.ymin
    const xmax=boundingBox.xmax
    const ymax=boundingBox.ymax

    const w=xmax-xmin
    const h=ymax-ymin

    //矩形の線
    ctx.lineWidth=lineWidth
    ctx.strokeRect(xmin,ymin,w,h)

    //矩形のオーバーレイ
    ctx.fillStyle="rgba(255,0,0,0.1)"
    ctx.fillRect(xmin,ymin,w,h)
    
    //端の4点の円
    const circleSize=4
    ctx.fillStyle="red"
    for(const point of boundingBox.getFourPoints()){
        ctx.beginPath();
        ctx.arc(point.x, point.y, circleSize,  0, Math.PI * 2, true); // 外の円
        ctx.fill()
    }
}

export function drawBox(ctx:CanvasRenderingContext2D,point1:{x:number,y:number},point2:{x:number,y:number},
                            lineWidth:number=3){
    const maxX=Math.max(point1.x,point2.x)
    const minX=Math.min(point1.x,point2.x)
    const maxY=Math.max(point1.y,point2.y)
    const minY=Math.min(point1.y,point2.y)

    const w=maxX-minX
    const h=maxY-minY

    ctx.lineWidth=lineWidth
    ctx.strokeRect(minX,minY,w,h)
}

export function drawBoundingBoxes(ctx:CanvasRenderingContext2D,boundingBoxes:BoundingBox[]){
    for(const box of boundingBoxes){
        drawBoundingBox(ctx,box)
    }
}

export function clear(ctx:CanvasRenderingContext2D){
    ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
}

export function drawCrossLine(ctx:CanvasRenderingContext2D, x:number,y:number){

    ctx.setLineDash([5,5])

    ctx.beginPath()
    ctx.lineWidth=2
    ctx.moveTo(x,0)
    ctx.lineTo(x,ctx.canvas.width)
    ctx.stroke()
    ctx.closePath()

    
    ctx.beginPath()
    ctx.setLineDash([5,5])

    ctx.moveTo(0,y)
    ctx.lineTo(ctx.canvas.height,y)
    ctx.stroke()
    ctx.closePath()
}