import React, { Component } from 'react';

import Icon from 'react-native-vector-icons/EvilIcons';
import Foundation from 'react-native-vector-icons/Foundation';


import ImagePicker from 'react-native-image-picker'

var config = require('../common/config')
var request = require('../common/request')
var uuid = require('uuid')

var Dimensions = require('Dimensions');
var width = Dimensions.get('window').width;
var photoOptions = {
    title: '选择图片',
    cancelButtonTitle: '取消',
    takePhotoButtonTitle: '拍照',
    chooseFromLibraryButtonTitle: '选择相册',
    quality: 0.75,
    allowsEditing: true,
    noData: false,
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
}
import * as Progress from 'react-native-progress';
import {
    StyleSheet,
    View,
    Text,
    TextInput,
    Button,
    ImageBackground,
    Image,
    Modal,
    TouchableOpacity,
    AsyncStorage
} from 'react-native'


function avatar(id, type) {
    if (id.indexOf('http') > -1) {
        return id
    }
    if (id.indexOf('data:image') > -1) {
        return id
    }
    if (id.indexOf('avatar/') > -1) {
        return config.cloudinary.base + '/' + type + '/upload/' + id
    }
    return 'http://pw9t2rozd.bkt.clouddn.com/' + id
}
class Account extends React.Component {
    constructor(props) {
        super(props)
        var user = this.props.user || {}
        this.state = {
            user: user,
            modalVisible: false
        }
        // this._submit=this._submit.bind(this)
        // this._logout=this._logout.bind(this)
        // this._changeUserState=this._changeUserState.bind(this)
    }
    _edit() {
        this.setState({
            modalVisible: true
        })
    }
    // 保存用户资料
    _submit() {
        this._asyncUser(false)
    }
    _closeModal() {
        this.setState({
            modalVisible: false
        })
    }
    _changeUserState(key, value) {
        var user = this.state.user
        user[key] = value
        this.setState({
            user: user
        })
    }
    componentDidMount() {
        var that = this
        AsyncStorage.getItem('user')
            .then((data) => {
                var tmp
                if (data) {
                    tmp = JSON.parse(data)
                }
                if (tmp && tmp.accessToken) {
                    that.setState({
                        user: tmp
                    })
                }
            })
    }
    _getQiniuToken() {
        var accessToken = this.state.user.accessToken
        config.debug = false
        var signatureURL = config.api.base + config.api.signature
        var params = {
            accessToken: accessToken,
            type: 'avatar',
            cloud: 'qiniu'
        }
        return request.post(signatureURL, params)
    }
    _takePhoto() {
        var that = this
        ImagePicker.showImagePicker(photoOptions, (res) => {
            if (res.didCancel) {
                return
            }
            var avatarData = 'data:image/jpeg;base64,' + res.data
            var accessToken = this.state.user.accessToken
            var uri = res.uri
            var key = uuid.v4() + '.jpeg'

            that._getQiniuToken(accessToken, key)
                .then((data) => {
                    if (data && data.success) {
                        var token = data.data.token
                        var key = data.data.key
                        var body = new FormData()
                        body.append('token', token)
                        body.append('key', key)
                        body.append('file', {
                            type: 'image/jpeg',
                            uri: uri,
                            name: key
                        })
                        that._upload(body)
                    }
                })
        })
    }
    _upload(body) {
        var that = this
        var xhr = new XMLHttpRequest()
        var url = config.qiniu.upload
        this.setState({
            avatarUploading: true,
            avatarProgress: 0
        })
        xhr.open('POST', url)
        xhr.onload = () => {
            if (xhr.status !== 200) {
                alert('请求失败')
                return
            }
            if (!xhr.responseText) {
                alert('请求失败')
                return
            }
            var response
            try {
                response = JSON.parse(xhr.response)
            } catch (error) {
                console.log(error)
            }
            if (response) {
                var user = this.state.user
                if (response.public_id) {
                    user.avatar = response.public_id
                }
                if (response.key) {
                    user.avatar = response.key
                }
                that.setState({
                    avatarUploading: false,
                    avatarProgress: 0,
                    user: user
                })
                that._asyncUser(true)
            }
        }
        if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    var percent = Number((event.loaded / event.total).toFixed(2))
                    that.setState({
                        avatarProgress: percent
                    })
                }
            }
        }
        xhr.send(body)
    }
    _asyncUser(isAvatar) {
        var that = this
        var user = this.state.user
        if (user && user.accessToken) {
            var url = config.api.base + config.api.update
            request.post(url, user).then((data) => {
                if (data && data.success) {
                    var user = data.data
                    if (isAvatar) {
                        alert('头像更新成功')
                    }
                    that.setState({
                        user: user,
                        modalVisible: false
                    }, () => {
                        AsyncStorage.setItem('user', JSON.stringify(user))
                    })
                }
            })
        }
    }
    render() {
        var user = this.state.user
        return (
            <View style={styles.container}>
                <View style={styles.toolbar}>
                    <Text style={styles.toolbarTitle}>添加狗狗账户</Text>
                    <Text style={styles.toolbarExtra} onPress={this._edit.bind(this)}>编辑</Text>
                </View>
                {

                    user.avatar
                        ? <TouchableOpacity style={styles.avatarContainer}
                            onPress={this._takePhoto.bind(this)}
                        >
                            <ImageBackground source={{ uri: avatar(user.avatar, 'image') }}
                                style={styles.avatarContainer}
                            >
                                <View style={styles.avatarBox}>
                                    {
                                        this.state.avatarUploading
                                            ? <Progress.Circle
                                                showsText={true}
                                                size={75}
                                                color={'#ee735c'}
                                                progress={this.state.avatarProgress}
                                            />
                                            :
                                            <Image source={{ uri: avatar(user.avatar, 'image') }} style={styles.avatar}
                                            />
                                    }
                                </View>
                                <Text style={styles.avatarTip}>戳这里换头像</Text>
                            </ImageBackground>
                        </TouchableOpacity>
                        : <View style={styles.avatarContainer}>
                            <Text style={styles.avatarTip}>添加狗狗头像</Text>
                            <TouchableOpacity style={styles.avatarBox} onPress={this._takePhoto.bind(this)}>
                                <View style={styles.avatarBox}>
                                    {
                                        this.state.avatarUploading
                                            ? <Progress.Circle
                                                showsText={true}
                                                size={75}
                                                color={'#ee735c'}
                                                progress={this.state.avatarProgress}
                                            />
                                            : <Icon
                                                name='plus'
                                                style={styles.plusIcon} />
                                    }
                                </View>
                            </TouchableOpacity>
                        </View>
                }

                <Modal
                    animate={true}
                    visible={this.state.modalVisible}
                >
                    <View style={styles.modalContainer}>
                        <Icon
                            name='close'
                            onPress={this._closeModal.bind(this)}
                            style={styles.closeIcon}
                        />
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>昵称</Text>
                            <TextInput
                                placeholder={'输入你的昵称'}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={user.nickname}
                                onChangeText={(text) => {
                                    this._changeUserState('nickname', text)
                                }}
                            />
                        </View>
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>品种</Text>
                            <TextInput
                                placeholder={'狗狗的品种'}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={user.breed}
                                onChangeText={(text) => {
                                    this._changeUserState('breed', text)
                                }}
                            />
                        </View>
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>年龄</Text>
                            <TextInput
                                placeholder={'狗狗的年龄'}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={user.age}
                                onChangeText={(text) => {
                                    this._changeUserState('age', text)
                                }}
                            />
                        </View>
                        <View style={styles.fieldItem}>
                            <Text style={styles.label}>性别</Text>
                            <Foundation.Button
                                onPress={() => {
                                    this._changeUserState('gender', 'male')
                                }}
                                style={[
                                    styles.gender,
                                    user.gender === 'male' && styles.genderChecked
                                ]}
                                name='male'
                            >男</Foundation.Button>
                            <Foundation.Button
                                onPress={() => {
                                    this._changeUserState('gender', 'female')
                                }}
                                style={[
                                    styles.gender,
                                    user.gender === 'female' && styles.genderChecked
                                ]}
                                name='female'>女</Foundation.Button>
                        </View>
                        <Button style={styles.btn} onPress={this._submit.bind(this)}
                            title='保存' />
                    </View>
                </Modal>

                <View style={styles.logoutBox}>
                    <Button style={styles.btn} onPress={this.props.logout}
                        title='退出登录' /></View>
            </View>
        )
    }


}
const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    toolbar: {
        flexDirection: 'row',
        paddingTop: 25,
        paddingBottom: 12,
        backgroundColor: '#ee735c'
    },
    toolbarTitle: {
        flex: 1,
        fontSize: 16,
        color: '#fff',
        textAlign: 'center',
        fontWeight: '600'
    },
    avatarContainer: {
        width: width,
        height: 140,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eee'
    },
    avatarTip: {
        color: '#fff',
        backgroundColor: 'transparent',
        fontSize: 14
    },
    avatarBox: {
        marginTop: 15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        marginBottom: 15,
        width: width * 0.2,
        height: width * 0.2,
        resizeMode: 'cover',
        borderRadius: width * 0.1
    },
    plusIcon: {
        padding: 20,
        paddingLeft: 25,
        paddingRight: 25,
        color: '#999',
        fontSize: 20,
        backgroundColor: '#fff',
        borderRadius: 8
    },
    toolbarExtra: {
        position: 'absolute',
        right: 10,
        top: 26,
        color: '#fff',
        textAlign: 'right',
        fontWeight: '600',
        fontSize: 14
    },
    modalContainer: {
        flex: 1,
        paddingTop: 50,
        backgroundColor: '#fff'
    },
    fieldItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 50,
        paddingLeft: 15,
        paddingRight: 15,
        borderColor: '#eee',
        borderBottomWidth: 1
    },
    label: {
        color: '#ccc',
        marginRight: 10
    },
    inputField: {
        flex: 1,
        height: 50,
        color: '#666',
        fontSize: 14
    },
    closeIcon: {
        position: 'absolute',
        width: 40,
        height: 40,
        fontSize: 32,
        right: 20,
        top: 30,
        color: '#ee735c'
    },
    gender: {
        backgroundColor: '#ccc'
    },
    genderChecked: {
        backgroundColor: '#ee735c'
    },
    logoutBox:
    {
        marginTop: 50
    },
    btn: {
        padding: 10,
        marginLeft: 10,
        marginRight: 10,
        backgroundColor: 'transparent',
        borderColor: '#EE735C',
        borderWidth: 1,
        borderRadius: 4,
        color: '#ee735c'
    }
})
module.exports = Account