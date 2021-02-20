const {dialog} =require("electron")
const fs=require("fs")
const fsPromise=require("fs").promises

function existsPath(event,path){
    return fs.existsSync(path)
}

function mkdir(event,path){
    fs.mkdirSync(path)
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


async function readdir(event,args){
    const {path}=args
    const files=await fsPromise.readdir(path)
    return files
}

async function readImageAsBase64(event,args){
    const {path}=args
    const buffer=await fsPromise.readFile(path)
    const base64=buffer.toString("base64")
    return base64
}

async function writeFile(event,args){
    const {path,data}=args
    await fsPromise.writeFile(path,data)
}

async function readFile(event,args){
    const content= await fsPromise.readFile(path,"utf-8")
    return content
}

module.exports={
    existsPath,
    mkdir,
    getCwd,
    showMessageBox,
    createEmptyFile,
    readClasses,
    showOpenDialog,
    readdir,
    readImageAsBase64,
    writeFile,
    readFile
}