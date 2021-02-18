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
            <button @click="open()" class="border border-gray-400 p-2">参照</button>
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
    async asyncData(){
        const cwd:string=await ApiManager.getCwd()
        return {
            location:cwd,
        }
    },
    data(){

        return {
            projectName:"",
        }
    },
    methods:{
        async create(){
            //TODO:2回目の作成ボタン押したときに重複して作らないようにする
            const projectName=this.projectName
            const location=((this as any).location) as string //TODO
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
            // await ApiManager.mkdir("./test")

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

            this.$nuxt.$router.push("/rect-annotator")
        },
        async open(){
            console.log("hi");


            (window as any).api.send("openDirectoryDialog")
        }
    }
})
</script>