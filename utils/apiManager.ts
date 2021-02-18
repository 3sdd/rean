
//window.api.send('key')の形から、関数の形で使いやすくする
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

        const annoDirPath=rootPath+"\\"+"annotations"
        await this.mkdir(annoDirPath)
        
        const classesPath=rootPath+"\\"+"classes.txt"
        await this.createEmptyFile(classesPath)
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
}