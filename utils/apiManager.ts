
//window.api.send('key')の形から、関数の形で使いやすくする

import { IImageData } from "./imageData"

//TODO:asyncっていつつけるんだ
export class ApiManager{

    static get api():any{
        return (window as any).api
    }
    static invoke(key:string,data:any){
        return this.api.invoke(key,data)
    }
    static async getCwd(){
        return this.api.invoke("getCwd",{})
    }
    static existsPath(path:string){
        return this.invoke("existsPath",path)
    }
    static async mkdir(path:string){
        this.invoke("mkdir",path)
    }

    static showMessageBox(options:any){
        return this.invoke("showMessageBox",{options})
    }

    static async createProject(projectName:string,path:string){
        //ルートフォルダー作成
        const rootPath=path+"\\"+projectName
        await this.mkdir(rootPath)
        
        //画像フォルダー作成
        const imgDirPath=rootPath+"\\"+"images"
        await this.mkdir(imgDirPath)
        
        //アノテーションフォルダー作成
        const annoDirPath=rootPath+"\\"+"annotations"
        await this.mkdir(annoDirPath)

        //クラスファイル作成
        const classesPath=rootPath+"\\"+"classes.txt"
        await this.createEmptyFile(classesPath)

        //rean.project.json作成
        const projectInfo={
            "version":"0.1.0",
            "annotationPath":"./annotations",
            "imagePath":"./images",
            "classPath":"./classes.txt"
        }
        const projectJsonString=JSON.stringify(projectInfo,null,4)
        await this.writeFile(rootPath+"\\"+"rean.project.json",projectJsonString)

    }

    static async createEmptyFile(path:string){
        this.invoke("createEmptyFile",{
            path
        })
    }

    static maximizeWindow(){
        this.invoke("maximizeWindow",null)
    }

    static async readClasses(path:string){
        const classes=await  this.invoke("readClasses",{path})
        return classes as string[]
    }

    static async showOpenDialog(options:any){
        return this.invoke("showOpenDialog",{
            options
        })
    }

    static async readdir(path:string){
        return this.invoke("readdir",{
            path
        })
    }

    static async readImageAsBase64(path:string){
        const ret=await this.invoke("readImageAsBase64",{
            path
        })
        return ret as string
    }

    static async readImageData(path:string){
        const ret:IImageData=await this.invoke("readImageData",{
            path
        })
        return ret
    }

    static async writeFile(path:string,data:any){
        await this.invoke("writeFile",{path,data})
    }
    static async readFile(path:string){
        const content=await this.invoke("readFile",{path})
        return content as string
    }

}