
const {contextBridge, ipcRenderer} =require("electron")

//window.api.keyの名前(data)で呼び出せるようにする
contextBridge.exposeInMainWorld(
    "api",{
        send:(key,data)=>{
            ipcRenderer.send(key,data)
        },
        invoke:(key,data)=>{
            return ipcRenderer.invoke(key,data)
        }
    }
)