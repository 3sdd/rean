<template>
    <div>
        <h1>プロジェクト作成</h1>
        
        <div>
            <label>プロジェクト名</label>
            <input type="text" v-model="projectName">
        </div>
        <div>
            <label>場所</label>
            <span>{{location}}</span> 
            <button @click="open()">参照</button>
        </div>

        <div>
            <nuxt-link to="/">戻る</nuxt-link>
            <button @click="create">作成</button>
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
        create(){
            const projectName=this.projectName
            const location=(this as any).location //TODO

            alert([projectName,location])
        },
        async open(){
            console.log("hi");


            (window as any).api.send("openDirectoryDialog")
        }
    }
})
</script>