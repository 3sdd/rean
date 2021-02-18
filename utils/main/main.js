const {dialog} =require("electron")
const fs=require("fs")


function existsPath(event,path){
    return fs.existsSync(path)
}

function mkdir(event,path){
    fs.mkdirSync(path)
}

async function openDialog(event,args){
    console.log("koko");
    

    const ret=await dialog.showOpenDialog({
        properties:["openDirectory"]
    })
    return ret
}

function getCwd(event,args){
    return process.cwd()
}

function showMessageBox(event,args){
    const {options}=args
    return dialog.showMessageBox(options)
}

function createEmptyFile(event,args){
    const {path}=args
    f=fs.openSync(path, "w");
    fs.closeSync(f)
}

module.exports={
    existsPath,
    mkdir,
    openDialog,
    getCwd,
    showMessageBox,
    createEmptyFile
}