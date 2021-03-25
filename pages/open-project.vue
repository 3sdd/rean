<template>
    <div>
        プロジェクトを開く
        <div class="ml-2 mb-12">
            <label class="block mb-1">場所</label>
            <span class="p-2 border border-gray-400">{{projectRootPath}}</span> 
            <button @click="openDialog()" class="border border-gray-400 p-2">参照</button>
        </div>

        <button @click="openProject()" 
            class="p-2 border border-gray-400 hover:bg-blue-200 ml-5 mr-2"
        >
            開く
        </button>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {ApiManager} from "@/utils/apiManager"
import { ProjectInfo } from '~/utils/projectInfo'

export default Vue.extend({
    data(){
        return {
            projectRootPath:"",
            reanProjectJson:null as any,
        }
    },
    async fetch(){
        const cwd:string=await ApiManager.getCwd()
        this.projectRootPath=cwd
    },
    methods:{
        async openDialog(){
            const result=await ApiManager.showOpenDialog({
                defaultPath:this.projectRootPath,
                properties:["openFile"],
                filters:[{name:"rean.project.json",extensions:["project.json"]}]
            })
            if(result.canceled){
                return
            }
            if(result.filePaths.length!==1){
                throw new Error("エラー:ファイルパスの数が１つではない")
            }

            const path=result.filePaths[0]

            const s=await ApiManager.parsePath(path)
            const filename=s.base
            const rootDir=s.dir

            if(filename!=="rean.project.json"){
                throw new Error("rean.project.jsonを選択してください。")
            }
            
            this.projectRootPath=rootDir

            const obj=await ApiManager.readFile(path)
            this.reanProjectJson=obj
        },
        openProject(){
            if(!this.reanProjectJson){
                throw new Error("rean.project.jsonエラー")
            }
            //TODO:プロジェクト名を直す
            const annotationPath=this.reanProjectJson.annotationPath
            const imagePath=this.reanProjectJson.imagePath
            const classPath=this.reanProjectJson.classPath
            const projectInfo=new ProjectInfo(
                "TODO:プロジェクト名",this.projectRootPath,
                annotationPath,imagePath,classPath
            )
            this.$store.commit("project/new",projectInfo)

            this.$router.push("/rect-annotator")
        }
    }
})
</script>