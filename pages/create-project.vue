<template>
    <div>
        <h1 class="p-3 mb-3 font-bold text-2xl">プロジェクト作成</h1>
        
        <div class="ml-2 mb-6">
            <label class="block mb-1">プロジェクト名<span class="text-red-600"> (*必須)</span></label>
            <input type="text" v-model="projectName"
                class="p-2 border border-gray-400"
                required
            >

        </div>
        <div class="ml-2 mb-12">
            <label class="block mb-1">場所</label>
            <span class="p-2 border border-gray-400">{{location}}</span> 
            <button @click="openDialog()" class="border border-gray-400 p-2">参照</button>
        </div>

        <div class="">
            <nuxt-link to="/"
                class="p-2 border border-gray-400 hover:bg-blue-200 ml-5 mr-2"
            >
                戻る
            </nuxt-link>
            <button @click="create"
                class="p-2  border border-gray-400 hover:bg-blue-200 ml-4"
            >作成</button>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import {ApiManager} from "@/utils/apiManager"

export default Vue.extend({
    data(){
        return {
            projectName:"",
            location:"",
        }
    },
    async fetch(){
        const cwd:string=await ApiManager.getCwd()
        this.location=cwd
    },
    methods:{
        async create(){
            //TODO:2回目の作成ボタン押したときに重複して作らないようにする
            const projectName=this.projectName
            const location=this.location
            console.log(location)

            if(projectName===""){
                //TODO:alertではだめ？
                ApiManager.showMessageBox({
                    type:"error",
                    title:"エラー",
                    message:"プロジェクト名が入力されていません。"
                })
                return
            }

            const dstPath=location+"\\"+projectName //TODO:path.join
            const exists=await ApiManager.existsPath(dstPath)
            if(exists){
                ApiManager.showMessageBox({
                    type:"error",
                    title:"エラー",
                    message:"すでにフォルダーが存在します。\n"+dstPath
                })
                return
            }
            await ApiManager.createProject(projectName,location)

            ApiManager.maximizeWindow()

            this.$router.push("/rect-annotator")
        },
        async openDialog(){
            //TODO:open-project.vueのopenDialogと一緒。まとめる
            const result=await ApiManager.showOpenDialog({
                defaultPath:this.location,
                properties:["openDirectory"]
            })
            console.log(result)
            if(result.canceled){
                return
            }
            if(result.filePaths.length!==1){
                throw new Error("エラー:ファイルパスの数が１つではない")
            }
            this.location=result.filePaths[0]
        }
    }
})
</script>