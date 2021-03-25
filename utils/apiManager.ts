
//window.api.send('key')の形から、関数の形で使いやすくする

import { IImageData } from "./imageData"
import { ProjectInfo } from "./projectInfo"

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

    static async createProject(projectInfo:ProjectInfo){
        //ルートフォルダー作成
        const rootPath=await ApiManager.joinPath(projectInfo.location,projectInfo.projectName)
        await this.mkdir(rootPath)
        
        //画像フォルダー作成
        const imgDirPath=await ApiManager.resolvePath(rootPath,projectInfo.imagePath)
        await this.mkdir(imgDirPath)
        
        //アノテーションフォルダー作成
        const annoDirPath=await ApiManager.resolvePath(rootPath,projectInfo.annotationPath)
        await this.mkdir(annoDirPath)

        //クラスファイル作成
        const classesPath=await ApiManager.resolvePath(rootPath,projectInfo.classPath)
        await this.createEmptyFile(classesPath)

        //rean.project.json作成
        const projectInfoJson={
            "version":"0.1.0",
            "annotationPath":projectInfo.annotationPath,
            "imagePath":projectInfo.imagePath,
            "classPath":projectInfo.classPath
        }
        const jsonPath=await ApiManager.resolvePath(rootPath,"./rean.project.json")
        const projectJsonString=JSON.stringify(projectInfoJson,null,4)
        await this.writeFile(jsonPath,projectJsonString)

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

    static async joinPath(...paths:string[]){
        return await this.invoke("joinPath",{paths}) as string
    }

    static async resolvePath(...paths:string[]){
        return  await this.invoke("resolvePath",{paths}) as string
    }

}