import {ProjectInfo} from "@/utils/projectInfo"

export const state=()=>({
    projectInfo:new ProjectInfo("","","","","","") //TODO:nullに
})

export const mutations={
    new(state,projectInfo){
        state.projectInfo=projectInfo
    },
    loadClasses(state,classes){
        state.projectInfo.classes=classes
    },
    updateSelectedImage(state,index){
        state.projectInfo.selectedImageIndex=index
    }
}