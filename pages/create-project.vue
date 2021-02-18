<template>
    <div>
        <h1>プロジェクト作成</h1>
        
        <div>
            <label>プロジェクト名</label>
            <input type="text" v-model="projectName">
        </div>
        <div>
            <label>場所</label>
            <span>{{location}}</span> <button>参照</button>
        </div>

        <div>
            <nuxt-link to="/">戻る</nuxt-link>
            <button @click="create">作成</button>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    data(){
        return {
            projectName:"",
            location:"C:\\users ....",
        }
    },
    methods:{
        create(){

            const projectName=this.projectName
            const location=this.location

            alert([projectName,location])
        }
    }
})
</script>