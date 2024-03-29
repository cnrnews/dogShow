'use strict'


var xss = require('xss')
var mongoose = require('mongoose')
var Video = mongoose.model('Video')
var Audio = mongoose.model('Audio')
var Creation = mongoose.model('Creation')
var robot = require('../service/robot')
var config = require('../../config/config')

var userFields = [
    'avatar', 'nickname', 'gender', 'age', 'breed'
];


function asyncMedia(videoId, audioId) {
    console.log('检查数据有效性')
    if (!videoId) return
    var query = {
        _id: audioId
    }
    if (!audioId) {
        query = {
            video: videoId
        }
    }
    Promise.all([
        Video.findOne({
            _id: videoId
        }).exec(),
        Audio.findOne(query).exec()
    ]).then((data) => {
        var video = data[0]
        var audio = data[1]

        if (!video || !video.public_id || !audio || !audio.public_id) {
            return
        }
        var video_public_id = video.public_id
        var audio_public_id = audio.public_id.replace('/', ':')
        var videoName = video.public_id.replace('/', '_') + '.mp4'
        var videoURL = 'http://res.cloudinary.com/dqcor8rnw/video/upload/' +
            'e_volume:-100/e_volume:400,l_video:' + audio_public_id + '/' + audio.public_id + '.mp4'
        var thumbName = video_public_id.replace('/', '_') + '.jpg'
        var thumbURL = 'http://res.cloudinary.com/dqcor8rnw/video/upload/' + video_public_id + '.jpg'


        robot.saveToQiniu(videoURL, videoName)
            .catch((err) => {
                console.log(err)
            }).then((response) => {
                if (response && response.key) {
                    audio.qiniu_video = response.key
                    audio.save().then((_audio) => {
                        console.log(_audio)
                        console.log('同步视频成功')
                    })
                }
            })
        robot.saveToQiniu(thumbURL, thumbName)
            .catch((err) => {
                console.log(err)
            }).then((response) => {
                if (response && response.key) {
                    audio.qiniu_thumb = response.key
                    audio.save().then((_audio) => {
                        console.log(_audio)
                        console.log('同步封面成功')
                    })
                }
            })
    })
}
// 视频列表
exports.find = function* (next) {
    var page = parseInt(this.query.page, 10) || 1
    var count = 5
    var offset = (page - 1) * count
    var queryArray = [
        Creation
            .find({ finish: 40 })
            .sort({
                'meta.createAt': -1
            })
            .skip(offset)
            .limit(count)
            .populate('author', userFields.join(' ')) // 连接
            .exec(),
        Creation.count({ finish: 40 }).exec()//
    ]
    var data = yield queryArray
    this.body = {
        success: true,
        data: data[0],
        total: data[1],
    }
}
// 发布视频
exports.save = function* (next) {
    var body = this.request.body
    var videoId = body.videoId
    var audioId = body.audioId
    var title = body.title
    var user = this.session.user

    var video = yield Video.findOne({
        _id: videoId
    }).exec()
    var audio = yield Audio.findOne({
        _id: audioId
    }).exec()

    if (!video || !audio) {
        this.body = {
            success: false,
            err: '音频或者视频素材不能为空'
        }
        return next
    }

    var creation = yield Creation.findOne({
        audio: audioId,
        videoId: videoId
    }).exec()

    if (!creation) {
        var creationData = {
            author: user._id,
            title: xss(title),
            audio: audioId,
            video: videoId,
            finish: 20
        }
        var video_public_id = video.public_id
        var audio_public_id = audio.public_id

        if (video_public_id && audio_public_id) {
            creationData.cloudinary_thumb = 'http://res.cloudinary.com/dqcor8rnw/video/upload/' + video_public_id + '.jpg'
            creationData.cloudinary_video = 'http://res.cloudinary.com/dqcor8rnw/video/upload/e_volume:-100/e_volume:400,l_video:' +
                audio.public_id.replace(/\//g, ':') + '/' + video_public_id + '.mp4'
            creationData.finish += 20
        }

        if (audio.qiniu_thumb) {
            creationData.qiniu_thumb = audio.qiniu_thumb,
                creationData.finish += 30
        }

        if (audio.qiniu_video) {
            creationData.qiniu_video = audio.qiniu_video,
                creationData.finish += 30
        }
        creation = new Creation(creationData)
    }
    creation = yield creation.save()

    this.body = {
        success: true,
        data: {
            _id: creation._id,
            finish: creation.finish,
            title: creation.title,
            qiniu_video: creation.qiniu_video,
            qiniu_thumb: creation.qiniu_thumb,
            author: {
                avatar: user.avatar,
                nickname: user.nickname,
                gender: user.gender,
                breed: user.breed,
                _id: user._id
            }
        }
    }


}
// 上传音频
exports.audio = function* (next) {
    var body = this.request.body
    var audioData = body.audio
    var videoId = body.videoId
    var user = this.session.user
    if (!audioData || !audioData.public_id) {
        this.body = {
            success: false,
            err: '音频没有上传成功!'
        }
        return next
    }

    var audio = yield Audio.findOne({
        public_id: audioData.public_id
    }).exec()
    var video = yield Video.findOne({
        _id: videoId
    }).exec()

    if (!audio) {
        var _audio = {
            author: user._id,
            public_id: audioData.public_id,
            detail: audioData
        }
        if (video) {
            _audio.video = video._id
        }
        audio = new Audio(_audio)
        audio = yield audio.save()
    }
    asyncMedia(video._id, audio._id)
    this.body = {
        success: true,
        data: audio._id
    }
}
// 上传视频
exports.video = function* (next) {
    var body = this.request.body
    var videoData = body.video
    var user = this.session.user

    if (!videoData || !videoData.key) {
        this.body = {
            success: false,
            err: '视频没有上传成功!'
        }
        return next
    }
    var video = yield Video.findOne({
        qiniu_key: videoData.key
    }).exec()

    if (!video) {
        video = new Video({
            author: user._id,
            qiniu_key: videoData.key,
            persistentId: videoData.persistentId
        })
        video = yield video.save()
    }
    var url = config.qiniu.video + videoData.key
    robot.uploadToCloudinary(url)
        .then((data) => {
            if (data && data.public_id) {
                video.public_id = data.public_id
                video.detail = data
                video.save().then((_video) => {
                    asyncMedia(_video._id)
                })
            }
        })
    this.body = {
        success: true,
        data: video._id
    }
}