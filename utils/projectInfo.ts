
export class ProjectInfo{
    projectName:string
    location:string

    classes:string[]=[]
    selectedImageIndex:number=-1

    constructor(projectName:string,location:string){
        this.projectName=projectName
        this.location=location
    }

}
