<template>
    <g v-if="show" >
        <!--縦線-->
        <line :x1="cx" :y1="0" :x2="cx" :y2="height"
            :stroke="color" :stroke-width="strokeWidth"
            :stroke-dasharray="dasharray"
        ></line>
        <!--横線-->
        <line :x1="0" :y1="cy" :x2="width" :y2="cy"
            :stroke="color" :stroke-width="strokeWidth"
            :stroke-dasharray="dasharray"
        ></line>
    </g>
</template>
<script lang="ts">
import Vue from 'vue'
export default Vue.extend({
    props:{
        show:{
            type:Boolean,
            required:true,
        },
        cx:{
            type:Number,
            required:true,
        },
        cy:{
            type:Number,
            required:true,
        },
        width:{
            type:Number,
            required:true,
        },
        height:{
            type:Number,
            required:true,
        },

        strokeWidth:{
            type:Number,
            required:false,
            default:4
        },
        color:{
            type:String,
            required:false,
            default:"gray"
        },
        dasharray:{
            type:Array,
            required:false,
            default:()=>([4,4])
        }
    }
})
</script>