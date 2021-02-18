const {dialog} =require("electron")
const fs=require("fs")
const readline=require("readline")

function existsPath(event,path){
    return fs.existsSync(path)
}

function mkdir(event,path){
    fs.mkdirSync(path)
}

//TODO:いらない
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

//classes.txtを読み込んでクラスをリスト形式で返す
async function readClasses(event,args){
    const {path}=args

    const text=fs.readFileSync(path).toString() //TODO:非同期で
    const classes=text.replace(/\r\n/g,"\n").split("\n")
    return classes
}


async function showOpenDialog(event,args){
    const {options}=args
    return dialog.showOpenDialog(options)
}

module.exports={
    existsPath,
    mkdir,
    openDialog,
    getCwd,
    showMessageBox,
    createEmptyFile,
    readClasses,
    showOpenDialog
}