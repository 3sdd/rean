<template>
    <div class="h-screen flex flex-col bg-red-200">

        <div class="p-2 bg-blue-200">
            <p>残り枚数 10000枚</p>
        </div>
        <div class="flex-1 flex flex-row bg-blue-400">
            <div class="w-40">
                <div v-if="base64image!==''">
                    <ThumbnailImage :src="base64image"></ThumbnailImage>
                </div>
            </div>
            <div class="flex-1 bg-purple-300">
                <canvas></canvas>
            </div>
            <div class="w-48 bg-purple-600 p-2">
                <ClassList :classes="classes"></ClassList>
            </div>
        </div>
    </div>
</template>
<script lang="ts">
import Vue from 'vue'
import {ApiManager} from "@/utils/apiManager"
import ClassList from "@/components/ClassList.vue"
import ThumbnailImage from "@/components/ThumbnailImage.vue"

export default Vue.extend({
    components:{
        ClassList,
        ThumbnailImage
    },
    data(){
        const testClasses=[
            "class_A",
            "class_B"
        ]
        const classes=testClasses
        return {
            classes,
            base64image:"",
        }
    },
    async mounted(){
        const path="./test/classes.txt" //TODO:プロジェクトのclassファイルに変える
        const classes=await ApiManager.readClasses(path)
        this.classes=classes

        ApiManager.maximizeWindow()

        const imgRoot="./test/images"
        const imageFiles=await ApiManager.readdir(imgRoot)
        console.log(imageFiles)
        
        const imgPath=imgRoot+"\\"+imageFiles[0]
        const base64Image=await ApiManager.readImageAsBase64(imgPath)
        console.log("base64")
        console.log(base64Image)

        this.base64image="data:image/png;base64,"+base64Image
        
        

        //URL.removeObjectURL()
    }
})
</script>