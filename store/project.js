import {ProjectInfo} from "@/utils/projectInfo"

export const state=()=>({
    // list:[],
    projectInfo:new ProjectInfo("","") //TODO:nullに
})

export const mutations={
    new(state,projectName,location){
        state.projectInfo=new ProjectInfo(
            projectName,location
        )
    },
    loadClasses(state,classes){
        state.projectInfo.classes=classes
    },
    updateSelectedImage(state,index){
        state.projectInfo.selectedImageIndex=index
    }
    // add(state,text){
    //     state.list.push({
    //         text,
    //         done:false,
    //     })
    // },
    // remove(state,{todo}){
    //     state.list.splice(state.list.indexOf(todo),1)
    // },
    // toggle(state,todo){
    //     todo.done=!todo.done
    // }
}