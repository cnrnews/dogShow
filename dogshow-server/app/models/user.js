'use strict'
var mongoose=require('mongoose')

var UserSchame=new mongoose.Schema({
    phoneNumber:{
        unique:true,
        type:String
    },
    areaCode:String,
    verfyCode:String,
    verified:{
        type:Boolean,
        default:false
    },
    accessToken:String,
    nickname:String,
    gender:String,
    breed:String,
    age:String,
    avatar:String,
    meta:{
        createAt:{
            type:Date,
            default:Date.now()
        },
        updateAt:{
            type:Date,
            default:Date.now()
        }
    }
})
UserSchame.pre('save',function(next){
    if(this.isNew)
    {
        this.meta.createAt=this.meta.updateAt=Date.now()
    }else{
        this.meta.updateAt=Date.now()
    }
    next()
})
module.exports=mongoose.model('User',UserSchame)