'use strict'
var mongoose = require('mongoose')
var Schema = mongoose.Schema
var ObjectId = Schema.Types.ObjectId
var Mixed = Schema.Types.Mixed

var AudioSchame = new Schema({
    author: {
        type: ObjectId,
        ref: 'User'
    },
    video: {
        type: ObjectId,
        ref: 'Video'
    },
    qiniu_video: String,
    qiniu_thumb: String,
    public_id: String,
    detail: Mixed,
    meta: {
        createAt: {
            type: Date,
            default: Date.now()
        },
        updateAt: {
            type: Date,
            default: Date.now()
        }
    }
})
AudioSchame.pre('save', function (next) {
    if (this.isNew) {
        this.meta.createAt = this.meta.updateAt = Date.now()
    } else {
        this.meta.updateAt = Date.now()
    }
    next()
})
module.exports = mongoose.model('Audio', AudioSchame)