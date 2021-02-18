
//window.api.send('key')の形から、関数の形で使いやすくする
export class ApiManager{

    static get api():any{
        return (window as any).api
    }
    static async getCwd(){
        return this.api.invoke("getCwd")
    }
}