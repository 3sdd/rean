<template>
    <div>
        <div v-for="(b64img,i) in base64images" :key="'b64img'+i"
            @click="onClick(i)"
            class="hover:bg-blue-200"
            :class="i===selectedImageIndex?'bg-red-400':'bg-gray-900'"
        >
            <ThumbnailImage :src="b64img"
            >
            </ThumbnailImage>
        </div>
    </div>
</template>

<script lang="ts">
import Vue from 'vue'
import ThumbnailImage from "@/components/ThumbnailImage.vue"

export default Vue.extend({
    components:{
        ThumbnailImage
    },
    props:{
        base64images:{
            type:Array,
            required:false,
            default:()=>[]
        },
        selectedImageIndex:{
            type:Number,
            required:false,
            default:-1
        }
    },
    methods:{
        onClick(index:number){
            this.$emit("image-clicked",index)
        }
    }
})
</script>