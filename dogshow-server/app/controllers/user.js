'use strict'
var xss = require('xss')
var mongoose = require('mongoose')
var uuid = require('uuid')
var sms = require('../service/sms')
var User = mongoose.model('User')
exports.sigup = function* (next) {
    var phoneNumber = xss(this.request.body.phoneNumber.trim())
    var user = yield User.findOne({
        phoneNumber: phoneNumber
    }).exec()
    var verifyCode = '0987'
    // sms.getCode()
    var accessToken = uuid.v4()
    if (!user) {
        user = new User({
            nickname: '小狗子',
            avatar: 'https://xh.2188.com.cn/./Uploads/Avatar/2019-08-01/5d424f2c0d86e.jpg',
            phoneNumber: phoneNumber,
            verifyCode: verifyCode,
            accessToken: accessToken
        })
    } else {
        user.accessToken = accessToken
    }
    try {
        user = yield user.save()
    } catch (error) {
        console.log('error:' + error)
        this.body = {
            success: false,
            err: error
        }
        return next
    }
    var msg = '您的注册验证码是:' + verifyCode
    try {
        // sms.sendCode(user.phoneNumber, msg)
    } catch (error) {
        this.body = {
            success: false,
            err: '短信服务异常'
        }
        return next
    }
    this.body = {
        success: true
    }
}
exports.verify = function* (next) {
    var verifyCode = this.request.body.verifyCode
    var phoneNumber = this.request.body.phoneNumber
    console.log(this.request.body)
    if (!verifyCode || !phoneNumber) {
        this.body = {
            success: false,
            err: '验证没通过'
        }
        return next
    }
    // 查找用户
    var user = yield User.findOne({
        phoneNumber: phoneNumber,
        // verifyCode: verifyCode
    }).exec()
    console.log(user)
    if (user) {
        user.verified = true
        user = yield user.save()
        this.body = {
            success: true,
            data: {
                nickname: user.nickname,
                accessToken: user.accessToken,
                avatar: user.avatar,
                _id: user._id
            }
        }
    } else {
        this.body = {
            success: false,
            err: '验证未通过'
        }
    }
    // this.body = {
    //     success: true
    // }
}
exports.update = function* (next) {
    var body = this.request.body
    // var accessToken = body.accessToken
    var user = this.session.user
    var fields = 'avatar,gender,age,nickname,breed'.split(',')
    // if (!user) {
    //     this.body = {
    //         success: false,
    //         err: '用户不见了'
    //     }
    //     return next
    // }

    fields.forEach((field) => {
        if (body[field]) {
            user[field] = xss(body[field].trim())
        }
    })
    user = yield user.save()
    this.body = {
        success: true,
        data: {
            nickname: user.nickname,
            accessToken: user.accessToken,
            avatar: user.avatar,
            age: user.age,
            breed: user.breed,
            gender: user.gender,
            _id: user._id
        }
    }
}