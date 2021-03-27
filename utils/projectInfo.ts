
export class ProjectInfo{
    projectName:string
    location:string
    
    annotationPath:string
    imagePath:string
    classPath:string
    exportPath:string

    classes:string[]=[]
    selectedImageIndex:number=-1

    constructor(projectName:string,location:string,
        annotationPath:string="./annotations",imagePath:string="./images",
        classPath:string="./classes.txt",exportPath:string="./export"
    ){
        this.projectName=projectName
        this.location=location

        this.annotationPath=annotationPath
        this.imagePath=imagePath
        this.classPath=classPath
        this.exportPath=exportPath
    }

}
