import { BoundingBox } from "./annotationData"


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

export function drawBoxes(ctx:CanvasRenderingContext2D,boundingBoxes:BoundingBox[]){
    for(const box of boundingBoxes){
        const point1={x:box.xmin,y:box.ymin}
        const point2={x:box.xmax,y:box.ymax}
        drawBox(ctx,point1,point2)
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