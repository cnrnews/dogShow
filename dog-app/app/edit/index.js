import React, { Component } from 'react';
import _ from 'lodash'
import Icon from 'react-native-vector-icons/FontAwesome';
import Foundation from 'react-native-vector-icons/Foundation';
import axios from 'axios'
import * as Progress from 'react-native-progress';
import ImagePicker from 'react-native-image-picker'
import { AudioRecorder, AudioUtils } from 'react-native-audio';
import CountDown from 'react-native-countdown-component';

var config = require('../common/config')
var request = require('../common/request')
var uuid = require('uuid')


var Dimensions = require('Dimensions');
var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;
var Video = require('react-native-video').default
var Sound = require('react-native-sound');
var videoOptions = {
    title: '选择视频',
    cancelButtonTitle: '取消',
    takePhotoButtonTitle: '录制10秒视频',
    chooseFromLibraryButtonTitle: '选择已有视频',
    videoQuality: 'medium',
    mediaType: 'video',
    durationLimit: 10,
    noData: false,
    storageOptions: {
        skipBackup: true,
        path: 'images'
    }
}

import {
    StyleSheet,
    View,
    Text,
    Image,
    Button,
    TextInput,
    Modal,
    PermissionsAndroid,
    AsyncStorage,
    TouchableOpacity
} from 'react-native'
var defaultState = {
    previewVideo: null,

    videoId: null,
    audioId: null,


    audioData: null,


    title: '',
    modalVisible: false,
    publishProgress: 0.2,
    publishing: false,
    willPublish: false,
    //video loads
    video: null,
    videoUploaded: false,
    videoUploading: false,
    videoLoaded: false,
    videoUploadedProgress: 0.01,


    counting: false,
    recording: false,


    //audio 
    audioPath: AudioUtils.DocumentDirectoryPath + '/gougou.aac',
    audio: null,
    audioPlaying: false,
    recordDone: false,

    audioUploaded: false,
    audioUploading: false,
    audioUploadedProgress: 0.14,

    playing: false,
    paused: false,
    videoProgress: 0.01,
    videoTotal: 0,
    currentTime: 0,

    // video
    rate: 1,
    muted: false,
    resizeMode: 'contain',
    repeat: false
}

class Edit extends Component {
    constructor(props) {
        super(props)
        var user = this.props.user || {}
        var state = _.clone(defaultState)
        state.user = user
        this.state = state
        // this._onProgress = this._onProgress.bind(this);
        // this._focus = this._focus.bind(this)
        this._submit = this._submit.bind(this)
        // this._closeModal = this._closeModal.bind(this)
        this.checkPermission = this.checkPermission.bind(this);
    }
    // 发布视频创意
    _submit() {
        var that = this
        var body = {
            title: this.state.title,
            videoId: this.state.videoId,
            audioId: this.state.audioId
        }
        var creationURL = config.api.base + config.api.creation
        var user = this.state.user
        if (user && user.accessToken) {
            body.accessToken = user.accessToken
            that.setState({
                publishing: true
            })
            request.post(creationURL, body)
                .catch((err) => {
                    alert('视频发布失败')
                }).then((data) => {
                    if (data && data.success) {
                        that._closeModal()
                        var state = _.clone(defaultState)
                        that.setState(state)
                    } else {
                        that.setState({
                            publishing: false
                        })
                        alert('视频发布失败')
                    }
                })
        }

    }
    // 选择视频
    _pickVideo() {
        var that = this
        ImagePicker.showImagePicker(videoOptions, (res) => {
            if (res.didCancel) {
                return
            }
            var state = _.clone(defaultState)
            var uri = res.uri
            state.previewVideo = uri
            state.user = this.state.user
            that.setState(state)
            that._getToken({
                type: 'video',
                cloud: 'qiniu'
            }).catch((err) => {
                alert(err)
            })
                .then((data) => {
                    if (data && data.success) {
                        var token = data.data.token
                        var key = data.data.key
                        var body = new FormData()
                        body.append('token', token)
                        body.append('key', key)
                        body.append('file', {
                            type: 'video/mp4',
                            uri: uri,
                            name: key
                        })
                        that._upload(body, 'video')
                    }
                })
        })
    }
    _uploadAudio() {
        if (!this.state.audioData) {
            alert('音频录制出错，请重新进行录制！')
            return
        }
        var that = this
        var tags = 'app,audio'
        var folder = 'audio'
        var timestamp = Date.now()
        that._getToken({
            type: 'audio',
            cloud: 'cloudinary',
            timestamp: timestamp
        }).catch((err) => {
            alert(err)
        }).then((data) => {
            if (data && data.success) {
                var signature = data.data.token
                var key = data.data.key
                var body = new FormData()

                body.append('folder', folder)
                body.append('signature', signature)
                body.append('tags', tags)
                body.append('timestamp', timestamp)
                body.append('api_key', config.cloudinary.api_key)
                body.append('resource_type', 'video')
                // body.append('file',that.state.audioPath)
                // that.state.audioData.audioFileURL)
                body.append('file',
                    {
                        type: 'video/mp4',
                        uri: that.state.audioData.audioFileURL,
                        name: key
                    })
                that._upload(body, 'audio')
            }
        })
    }
    // 上传资源到七牛或者cloudinary
    _upload(body, type) {

        var that = this
        var xhr = new XMLHttpRequest()
        var url = config.qiniu.upload

        // 音频上传到cloudinary
        if (type === 'audio') {
            url = config.cloudinary.video
        }

        var state = {}
        // state[type + 'UploadedProgress'] = 0
        state[type + 'Uploading'] = true
        state[type + 'Uploaded'] = false

        that.setState(state)
        xhr.open('POST', url)
        xhr.onload = () => {
            // 请求失败
            if (xhr.status !== 200) {
                alert('上传失败，请重试')
                return
            }

            if (!xhr.responseText) {
                alert('上传失败，请重试')
                return
            }

            var response
            try {
                response = JSON.parse(xhr.response)
            } catch (e) {
            }
            if (response) {
                var newState = {}
                newState[type] = response
                newState[type + 'Uploading'] = false
                newState[type + 'Uploaded'] = true
                that.setState(newState)

                // 上传到我们自己的服务器
                var updateURL = config.api.base + config.api[type]
                var accessToken = this.state.user.accessToken
                var updateBody = {
                    accessToken: accessToken
                }
                updateBody[type] = response
                if (type === 'audio') {
                    updateBody.videoId = that.state.videoId
                }
                request.post(updateURL, updateBody)
                    .catch(err => {
                        console.log(err)
                        if (type === 'video') {
                            alert('视频同步出错，请重新上传')
                        } else if (type === 'audio') {
                            alert('音频同步出错，请重新上传')
                        }
                    })
                    .then(data => {
                        if (data && data.success) {
                            var mediaState = {}
                            mediaState[type + 'Id'] = data.data
                            if (type === 'audio') {
                                that._showModal()
                                mediaState.willPublish = true
                            }
                            that.setState(mediaState)
                        } else {
                            if (type === 'video') {
                                alert('视频同步出错，请重新上传')
                            } else if (type === 'audio') {
                                alert('音频同步出错，请重新上传')
                            }
                        }
                    })
            }
        }
        // 请求出错
        xhr.onerror = e => {
        };
        // 进度条
        if (xhr.upload) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    var percent = Number((event.loaded / event.total).toFixed(2))
                    var progressState = {}
                    progressState[type + 'UploadedProgress'] = percent
                    that.setState(progressState)
                }
            }
        }
        xhr.send(body)
    }
    _getToken(body) {
        var signatureURL = config.api.base + config.api.signature
        body.accessToken = this.state.user.accessToken
        return request.post(signatureURL, body)
    }
    // 关闭对话框
    _closeModal() {
        this.setState({
            modalVisible: false
        })
    }
    // 打开对话框
    _showModal() {
        this.setState({
            modalVisible: true
        })
    }
    _onLoadStart() {
        console.log('onLoadStart')
    }
    _onLoad() {
        console.log('onLoad')
    }
    _onProgress(data) {
        var duration = data.playableDuration
        var currentTime = data.currentTime
        var percent = Number((currentTime / duration).toFixed(2))
        this.setState({
            videoTotal: duration,
            currentTime: Number(data.currentTime.toFixed(2)),
            videoProgress: percent
        })
    }
    _record() {

        this.setState({
            videoProgress: 0,
            counting: false,
            recordDone: false,
            recording: true
        })
        this.refs.videoPlayer.seek(0)
        AudioRecorder.startRecording()
    }
    _preview() {
        if (this.state.audioPlaying) {
            AudioRecorder.stopRecording()
        }
        this.setState({
            videoProgress: 0,
            audioPlaying: true
        })
        this._playAudio()
        this.refs.videoPlayer.seek(0)
    }
    _playAudio() {
        Sound.setCategory('Playback');
        var whoosh = new Sound(this.state.audioPath, Sound.MAIN_BUNDLE, (error) => {
            if (error) {
                console.log('failed to load the sound', error);
                return;
            }
            // loaded successfully
            console.log('duration in seconds: ' + whoosh.getDuration() + 'number of channels: ' + whoosh.getNumberOfChannels());

            // Play the sound with an onEnd callback
            whoosh.play((success) => {
                if (success) {
                    console.log('successfully finished playing');
                } else {
                    console.log('playback failed due to audio decoding errors');
                }
            });
        });
    }
    _onEnd() {
        if (this.state.recording) {
            AudioRecorder.stopRecording()
            this.setState({
                videoProgress: 1,
                recordDone: true,
                recording: false
            })
        }
        console.log('onEnd')
    }
    _rePlay() {
        this.refs.videoPlayer.seek(0)
    }
    _onError(e) {
        this.setState({
            videoOk: false
        })
    }
    // 暂停
    _pause() {
        if (!this.state.paused) {
            this.setState({
                paused: true
            })
        }
    }
    // 播放
    _resume() {
        if (this.state.paused) {
            this.setState({
                paused: false
            })
        }
    }
    checkPermission() {
        if (Platform.OS !== 'android') {
            return Promise.resolve(true);
        }


        alert('checkPermission')
        const rationale = {
            'title': '获取录音权限',
            'message': 'XXX正请求获取麦克风权限用于录音,是否准许'
        };
        return PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, rationale)
            .then((result) => {
                // alert(result);     //结果: granted ,    PermissionsAndroid.RESULTS.GRANTED 也等于 granted
                return (result === true || PermissionsAndroid.RESULTS.GRANTED)
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


        // 请求授权
        AudioRecorder.requestAuthorization()
            .then(isAuthor => {
                console.log('是否授权: ' + isAuthor)
                if (!isAuthor) {
                    return alert('请前往设置开启录音权限')
                }
                // this.setState({ hasPermission: isAuthor })
                AudioRecorder.prepareRecordingAtPath(that.state.audioPath, {
                    SampleRate: 22050,
                    Channels: 1,
                    IncludeBase64: true,
                    // AudioQuality: "Low",
                    AudioEncoding: "aac"
                }).then((res) => {
                    console.log('res=' + res);
                    // 录音进展
                    AudioRecorder.onProgress = (res) => {
                        console.log('onProgress=' + res)
                        // this.setState({ currentTime: Math.floor(data.currentTime) });
                    };
                    // 完成录音
                    AudioRecorder.onFinished = (res) => {
                        that.state.audioData = res
                        // data 返回需要上传到后台的录音数据
                        console.log('onFinished')
                        console.log(res)
                    };
                }).catch((e) => {
                    console.log(e)
                });

                // this._initAudio()
            })
    }
    _counting() {
        if (!this.state.counting && !this.state.recording &&
            !this.state.audioPlaying) {
            this.setState({
                counting: true
            })
        }
        this.refs.videoPlayer.seek(this.state.videoTotal - 0.01)
    }
    render() {
        return (
            <View style={styles.container}>
                <View style={styles.toolbar}>
                    <Text style={styles.toolbarTitle}>
                        {
                            this.state.previewVideo ? '点击按钮配音'
                                : '理解狗狗，从配音开始'
                        }
                    </Text>
                    {
                        this.state.previewVideo && this.state.videoUploaded
                            ? <Text style={styles.toolbarExtra} onPress=
                                {this._pickVideo.bind(this)}>更换视频</Text>
                            : null
                    }
                </View>
                <View style={styles.page}>
                    {
                        this.state.previewVideo
                            ? <View style={styles.videoContainer}>
                                <View style={styles.videoBox}>
                                    <Video
                                        ref='videoPlayer'
                                        source={{ uri: this.state.previewVideo }}
                                        style={styles.video}
                                        volume={5}
                                        paused={this.state.paused}
                                        rate={this.state.rate}
                                        muted={this.state.muted}
                                        resizeMode={this.state.resizeMode}
                                        repeat={this.state.repeat}

                                        onLoadStart={this._onLoadStart.bind(this)}
                                        onLoad={this._onLoad.bind(this)}
                                        onProgress={this._onProgress.bind(this)}
                                        onEnd={this._onEnd.bind(this)}
                                        onError={this._onError.bind(this)}
                                    />
                                    {
                                        !this.state.videoUploaded && this.state.videoUploading
                                            ? <View style={styles.progressTipBox}>
                                                <Progress.Bar color='#ee735c' height={1} progress={this.state.videoUploadedProgress} width={width} />
                                                <Text style={styles.progressTip}>
                                                    正在生成静音视频，已完成{(this.state.videoUploadedProgress * 100).toFixed(2)}%
                                                </Text>
                                            </View>
                                            : null
                                    }
                                    {
                                        this.state.recording || this.state.audioPlaying
                                            ? <View style={styles.progressTipBox}>
                                                <Progress.Bar color='#ee735c' height={1}
                                                    progress={this.state.videoProgress} width={width} />
                                                {
                                                    this.state.recording
                                                        ? <Text style={styles.progressTip}>
                                                            录制声音中
                                                      </Text>
                                                        : null
                                                }
                                            </View>
                                            : null
                                    }

                                    {
                                        this.state.recordDone
                                            ? <View style={styles.previewBox}>
                                                <Icon name='play' style={styles.previewIcon} />
                                                <Text style={styles.previewText}
                                                    onPress={this._preview.bind(this)}>预览</Text>
                                            </View>
                                            : null
                                    }
                                </View>
                            </View>
                            :
                            <TouchableOpacity
                                style={styles.uploadContainer}
                                onPress={this._pickVideo.bind(this)}>
                                <View style={styles.uploadBox}>
                                    <Image
                                        source={require('../assets/images/record.png')}
                                        style={styles.uploadIcon}
                                    />
                                    <Text style={styles.uploadTitle}>
                                        点我上传视频
                            </Text>
                                    <Text style={styles.uploadDesc}>
                                        建议时长不超过20秒
                            </Text>
                                </View>
                            </TouchableOpacity>
                    }

                    {
                        this.state.videoUploaded
                            ? <View style={styles.recordBox}>
                                <View style={[styles.recordIconBox,
                                (this.state.recording || this.state.audioPlaying) && styles.recordOn]}>
                                    {
                                        this.state.counting && !this.state.recording
                                            ?
                                            <CountDown
                                                style={styles.countBtn}
                                                until={3}
                                                running={this.state.counting}
                                                onFinish={
                                                    this._record.bind(this)
                                                }
                                                digitStyle={{ backgroundColor: '#ee735c' }}
                                                digitTxtStyle={{ color: 'white' }}
                                                timeToShow={['S']}
                                            />

                                            :
                                            <TouchableOpacity
                                                onPress={
                                                    this._counting.bind(this)}>
                                                <Icon name='microphone' style={styles.recirdIcon} />
                                            </TouchableOpacity>
                                    }
                                </View>
                            </View>
                            : null

                    }

                    {
                        this.state.videoUploaded && this.state.recordDone
                            ? <View style={styles.uploadAudioBox}>
                                {
                                    !this.state.audioUploaded && !this.state.audioUploading
                                        ?
                                        <Text style={styles.uploadAudioText}
                                            onPress={this._uploadAudio.bind(this)}>
                                            下一步
                                    </Text>
                                        : null
                                }
                                {
                                    this.state.audioUploading
                                        ? <Progress.Circle
                                            showsText={true}
                                            size={75}
                                            color={'#ee735c'}
                                            progress={this.state.audioUploadedProgress}
                                        />
                                        : null
                                }
                            </View>
                            : null
                    }
                </View>
                <Modal
                    animate={false}
                    visible={this.state.modalVisible}
                >
                    <View style={styles.modalContainer}>
                        <Icon
                            name='close'
                            onPress={this._closeModal.bind(this)}
                            style={styles.closeIcon}
                        />
                        <View style={styles.fieldBox}>
                            <TextInput
                                placeholder={'给狗狗一句宣言吧'}
                                style={styles.inputField}
                                autoCapitalize={'none'}
                                autoCorrect={false}
                                defaultValue={this.state.title}
                                onChangeText={(text) => {
                                    this.setState({
                                        title: text
                                    })
                                }}
                            />
                        </View>
                        <View style={styles.loadingBox}>
                            <Text style={styles.loadingText}>
                                耐心等一下，拼命为您生成专属视频中...
                            </Text>
                                <Text style={styles.loadingText}>
                                    正在合并视频音频...
                            </Text>
                                <Text style={styles.loadingText}>
                                    开始上传...
                            </Text>
                        </View>
                        <View style={styles.submitBox}>
                            <Button style={styles.btn} onPress={this._submit} title='发布视频' />
                        </View>
                    </View>
                </Modal>
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
    toolbarExtra: {
        position: 'absolute',
        right: 10,
        top: 26,
        color: '#fff',
        textAlign: 'right',
        fontWeight: '600',
        fontSize: 14
    },
    page: {
        flex: 1,
        alignItems: 'center'
    },
    uploadContainer: {
        marginTop: 90,
        width: width - 40,
        height: 180,
        paddingBottom: 10,
        borderWidth: 1,
        borderColor: '#ee735c',
        justifyContent: 'center',
        borderRadius: 6,
        backgroundColor: '#fff'
    },
    uploadTitle: {
        marginBottom: 10,
        textAlign: 'center',
        fontSize: 16,
        marginTop: -47,
        color: '#000'
    },
    uploadDesc: {
        color: '#999',
        textAlign: 'center',
        fontSize: 12,
        marginTop: -10
    },
    uploadIcon: {
        width: 110,
        marginTop: -51,
        resizeMode: 'contain'
    },
    uploadBox: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center'
    },
    videoContainer: {
        width: width,
        justifyContent: 'center',
        alignItems: 'flex-start'
    },
    videoBox: {
        width: width,
        height: height * 0.6
    },
    video: {
        width: width,
        height: height * 0.6,
        backgroundColor: '#333'
    },
    progressBar: {
        width: width,
        color: '#ee735c',
        height: 2,
    },
    progressTipBox: {
        width: width,
        height: 30,
        // backgroundColor: 'rgba(244,244,244,0.65)'
    },
    progressTip: {
        color: '#333',
        width: width - 10,
        padding: 5
    },
    recordIconBox: {
        width: 68,
        height: 68,
        marginTop: -30,
        borderRadius: 34,
        backgroundColor: '#ee735c',
        borderWidth: 1,
        borderColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center'
    },
    recirdIcon: {
        fontSize: 58,
        backgroundColor: 'transparent',
        color: '#fff'
    },
    countBtn: {
        fontSize: 32,
        fontWeight: '600',
        color: '#fff'
    },
    recordOn: {
        backgroundColor: '#ccc'
    },
    previewBox: {
        width: 80,
        height: 30,
        position: 'absolute',
        right: 10,
        bottom: 10,
        borderWidth: 1,
        borderColor: '#ee735c',
        borderRadius: 3,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center'
    },
    uploadAudioBox: {
        width: width,
        height: 60,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center'
    }
    ,
    uploadAudioText: {
        width: width - 20,
        padding: 5,
        borderWidth: 1,
        borderColor: '#ee735c',
        borderRadius: 5,
        textAlign: 'center',
        fontSize: 30,
        color: '#ee735c'
    },
    modalContainer: {
        width: width,
        height: height,
        paddingTop: 50,
        backgroundColor: '#fff'
    },
    closeIcon: {
        position: 'absolute',
        fontSize: 32,
        right: 20,
        top: 30,
        color: '#ee735c'
    },
    loadingBox: {
        width: width,
        height: 50,
        marginTop: 10,
        padding: 15,
        alignItems: 'center'
    },
    loadingText: {
        marginBottom: 10,
        textAlign: 'center',
        color: '#333'
    },
    inputField: {
        height: 36,
        textAlign: 'center',
        color: '#666',
        fontSize: 14
    },
    fieldBox: {
        width: width - 40,
        height: 36,
        marginTop: 30,
        marginLeft: 20,
        marginRight: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eaeaea'
    },
    submitBox: {
        marginTop: 110,
        padding: 15
    }
})
module.exports = Edit