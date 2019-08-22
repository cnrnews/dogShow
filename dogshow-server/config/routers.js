'use strict'

var Router=require('koa-router')
var User=require('../app/controllers/user')
var App=require('../app/controllers/app')
var Creation=require('../app/controllers/creation')
var Comment=require('../app/controllers/comment')


module.exports=function(){
    var router=new Router({
        prefix:'/api'
    })
    // User
    router.post('/u/sigup',App.hasBody,User.sigup)
    router.post('/u/verify',App.hasBody,User.verify)
    router.post('/u/update',App.hasBody,App.hasToken,User.update)
    // APP
    router.post('/signature',App.hasBody,App.hasToken,App.signature)


    // comments
    router.get('/comments',App.hasToken,Comment.find)
    router.post('/comments',App.hasBody,App.hasToken,Comment.save);
    
    // Creation
    router.get('/creationlist',App.hasToken,Creation.find)
    router.post('/creations',App.hasBody,App.hasToken,Creation.save)
    router.post('/creations/video',App.hasBody,App.hasToken,Creation.video)
    router.post('/creations/audio',App.hasBody,App.hasToken,Creation.audio)
    return router
}