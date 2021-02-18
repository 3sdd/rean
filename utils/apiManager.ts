
//window.api.send('key')の形から、関数の形で使いやすくする
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
        this.mkdir(rootPath)
        
        //画像フォルダー作成
        const imgDirPath=rootPath+"\\"+"images"
        this.mkdir(imgDirPath)

        const annoDirPath=rootPath+"\\"+"annotations"
        this.mkdir(annoDirPath)
        
        //TODO:クラスファイル作成　classes.txt

    }
}