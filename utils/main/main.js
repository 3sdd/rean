const {dialog} =require("electron")

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


module.exports={
    openDialog,
    getCwd
}