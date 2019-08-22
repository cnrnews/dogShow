'use strict'
// true 表示使用阿里的rap接口
var debug = false
module.exports = {
    debug: debug,
    header: {
        method: 'POST',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    },
    api: {
        base: debug ? 'http://rap2api.taobao.org/app/mock/227539/' : 'http://192.168.2.13:1234',
        up: '/api/up',
        creations: '/api/creationlist',
        creation: '/api/creations',
        video: '/api/creations/video',
        audio: '/api/creations/audio',
        comments: '/api/comments',
        // comment: '/api/comment',
        signup: '/api/u/sigup',// 注册
        verify: '/api/u/verify',
        signature: '/api/signature',
        update: '/api/u/update',
    },
    qiniu: {
        upload: 'http://up-z2.qiniup.com/',
        videoUrl: 'http://ogx55myfx.bkt.clouddn.com/', // 视频存储空间,包括视频缩略图
        avatarUrl: 'http://ofafv8os7.bkt.clouddn.com/', // 头像存储空间
        defaultAvatar: 'http://ofafv8os7.bkt.clouddn.com/default.png' // 默认头像
    },
    cloudinary: {
        cloud_name: 'dqcor8rnw',
        api_key: '433719241448235',
        api_secret: 'KndEtuJp9VSp28zM2nmahBC6woU',
        base: 'http://res.cloudinary.com/dqcor8rnw',
        image: 'https://api.cloudinary.com/v1_1/dqcor8rnw/image/upload',
        video: 'https://api.cloudinary.com/v1_1/dqcor8rnw/video/upload',
        audio: 'https://api.cloudinary.com/v1_1/dqcor8rnw/raw/upload'
    }
}