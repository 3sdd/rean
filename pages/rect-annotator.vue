<template>
    <div class="h-screen flex flex-col bg-red-200">

        <div class="p-2 bg-blue-200">
            <p>残り枚数 10000枚</p>
        </div>
        <div class="flex-1 flex flex-row bg-blue-400">
            <div class="w-40 h-ful overflow-y-auto">
                <div v-for="(b64img,i) in base64images" :key="'b64img'+i">
                    <ThumbnailImage :src="b64img"></ThumbnailImage>
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
        return {
            // classes:[] as Array<string>, 
            base64images:[] as Array<string>
        }
    },
    async mounted(){
        const path="./TestProject/classes.txt" //TODO:プロジェクトのclassファイルに変える
        const classes=await ApiManager.readClasses(path)
        this.$store.commit("project/loadClasses",classes)

        ApiManager.maximizeWindow()

        const imgRoot="./TestProject/images" //TODO:プロジェクトの画像フォルダーのパスに変える
        const imageFiles=await ApiManager.readdir(imgRoot)

        for(const imgFile of imageFiles){
            const imgPath=imgRoot+"\\"+imgFile
            const base64Image=await ApiManager.readImageAsBase64(imgPath)
            this.base64images.push("data:image/png;base64,"+base64Image)
        }
        
    },
    computed:{
        projectInfo(){
            return this.$store.state.project.projectInfo
        },

        classes():string[]{
            return this.projectInfo.classes as string[]
        }
    }
})
</script>