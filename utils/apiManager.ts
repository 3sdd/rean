
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
    static async existsPath(path:string){
        return this.invoke("existsPath",path)
    }
    static async mkdir(path:string){
        this.invoke("mkdir",path)
    }
}