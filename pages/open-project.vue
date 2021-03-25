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
                properties:["openDirectory"]
            })
            // console.log(result)
            if(result.canceled){
                return
            }
            if(result.filePaths.length!==1){
                throw new Error("エラー:ファイルパスの数が１つではない")
            }
            this.projectRootPath=result.filePaths[0]
        },
        openProject(){
            //TODO:読み込んだ情報でインスタンス作成するようにする
            const projectInfo=new ProjectInfo(
                "TODO:プロジェクト名",this.projectRootPath,
                "","",""
            )
            // this.$store.commit("project/new",{
            //     projectName:"TODO:プロジェクト名", //TODO:projectRootPathのフォルダー名を入れる
            //     location:this.projectRootPath
            // })

            this.$router.push("/rect-annotator")
        }
    }
})
</script>