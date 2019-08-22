import React, { Component } from 'react';

import VectorIcon from 'react-native-vector-icons/EvilIcons';
import util from '../common/util'
var config = require('../common/config')
var request = require('../common/request')
var Dimensions = require('Dimensions');
var width = Dimensions.get('window').width;
var Video = require('react-native-video').default
import {
    StyleSheet,
    View,
    Text,
    Button,
    TextInput,
    Image,
    ProgressBarAndroid,
    TouchableOpacity,
    AsyncStorage,
    FlatList,
    Modal
} from 'react-native'
var cacheResults = {
    nextPage: 1,
    items: [],
    total: 0
}
// 播放进度相关状态
var videoPlayState = {
    videoTotal: 0,
    currentTime: '',
    videoProgress: '',
    videoLoaded: false,
    playing: false,
}
class Detail extends React.Component {
    constructor(props) {
        super(props);
        var data = this.props.data
        this.state = {
            // 评论信息
            list: [],
            isLoadingTail: false,

            videoOk: true,//视频是否有误


            data: data,

            // modal
            content: '',
            animationType: 'none',
            modalVisible: false,
            isSending: false,

            rate: 1,
            muted: false,
            resizeMode: 'contain',
            repeat: false
        }
        this._onProgress = this._onProgress.bind(this);
        this._focus = this._focus.bind(this)
        this._submit = this._submit.bind(this)
        this._closeModal = this._closeModal.bind(this)
    }
    _pop() {
        this.props.navigator.pop()
    }
    _onLoadStart() {
        console.log('onLoadStart')
    }
    _onLoad() {
        console.log('onLoad')
    }
    _onProgress(data) {
        var duration = data.seekableDuration
        if (duration == 0) {
            return
        }
        var currentTime = data.currentTime
        var percent = Number((currentTime / duration).toFixed(2))
        videoPlayState.videoTotal = duration
        videoPlayState.currentTime = Number(data.currentTime.toFixed(2))
        videoPlayState.videoProgress = percent
        if (!videoPlayState.videoLoaded) {
            videoPlayState.videoLoaded = true
        }
        if (!videoPlayState.playing) {
            videoPlayState.playing = true
        }
        // this.setState(newState)
    }
    _onEnd() {
        this.setState({
            videoProgress: 1,
            // playing: false,
        })
        videoPlayState.playing = false
        console.log('onEnd')
    }
    _rePlay() {
        if (this.refs.videoPlayer) {
            this.refs.videoPlayer.seek(0)
        }
    }
    _onError(e) {
        this.setState({
            videoOk: false
        })
        console.log(e)
        console.log('onError')
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
    // 标题栏
    _renderNav() {
        return (
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBox} onPress={this._pop.bind(this)}>
                    <VectorIcon name='chevron-left' style={styles.backIcon}></VectorIcon>
                    <Text style={styles.backText}>返回</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>视频详情页</Text>
            </View>
        )
    }

    // 评论列表头部
    _renderCommentHeader() {
        var data = this.props.data
        return (
            <View style={styles.listHeader}>
                <View style={styles.infoBox}>
                    <Image style={styles.avatar} source={{
                        uri: data.author.avatar
                    }} />
                    <View style={styles.descBox}>
                        <Text style={styles.nickname}>
                            {data.author.nickname}
                        </Text>
                        <Text style={styles.title}>
                            {data.title}
                        </Text>
                    </View>
                </View>
                {/* 评论区 */}
                <View style={styles.commentBox}>
                    <View style={styles.comment}>
                        <TextInput
                            placeholder='说点什么'
                            style={styles.content}
                            multiline={true}
                            text={this.state.content}
                            onFocus={this._focus}
                        />
                    </View>
                </View>
                <View style={styles.commentArea}>
                    <Text style={styles.commentTitle}>
                        精彩评论
                    </Text>
                </View>
            </View>)
    }
    // 渲染评论区域
    _renderComments() {
        var data = this.props.data
        return (
            <View>
                <FlatList
                    data={this.state.list}
                    keyExtractor={(item, index) => String(index)}
                    ListFooterComponent={this._renderFooter()}
                    ListHeaderComponent={this._renderCommentHeader()}
                    onEndReached={this._onEndReached.bind(this)}
                    onEndReachedThreshold={20}
                    showsVerticalScrollIndicator={false}
                    // showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => this._renderRow(item)}
                />
                <Modal
                    animationType={'fade'}
                    visible={this.state.modalVisible}
                    onRequestClose={() => this._setModalVisible.bind(this, false)}
                >
                    <View
                        style={styles.modalContainer}
                    >
                        <VectorIcon onPress={this._closeModal}
                            name='close'
                            style={styles.closeIcon}
                        />
                        <View style={styles.commentBox}>
                            <View style={styles.comment}>
                                <TextInput
                                    placeholder='说点什么'
                                    style={styles.content}
                                    multiline={true}
                                    onFocus={this._focus}
                                    onBlur={this._blur}
                                    defaultValue={this.state.content}
                                    onChangeText={(text) => {
                                        this.setState({
                                            content: text
                                        })
                                    }}
                                />
                                <Button
                                    style={styles.submitBtn}
                                    onPress={this._submit}
                                    title='评论'
                                />
                            </View>
                        </View>
                    </View>
                </Modal>
                {/* </ScrollView> */}
            </View >
        )
    }
    _submit() {
        if (!this.state.content) {
            return alert('留言不能为空！')
        }
        if (this.state.isSending) {
            return alert('正在评论中...')
        }
        var that = this
        this.setState({
            isSending: true
        }, () => {
            var body = {
                accessToken: that.state.user.accessToken,
                comment: {
                    creation: that.state.data._id,
                    content: that.state.content
                }
            }
            var url = config.api.base + config.api.comments
            request.post(url, body).then((data) => {
                if (data && data.success) {
                    var items = cacheResults.items.slice()
                    var content = that.state.content
                    items = data.data.concat(items);
                    cacheResults.items = items
                    cacheResults.total = cacheResults.total + 1
                    that.setState({
                        content: '',
                        isSending: false,
                        // list: cacheResults.items,
                        modalVisible: false
                    })

                    // var items = cacheResults.items.slice()
                    // var content = that.state.content
                    // items = jsonData.data.concat(cacheResults.items)

                    // cacheResults.items = items
                    // cacheResults.total = cacheResults.total + 1

                    // that.setState({
                    //     content: '',
                    //     isSending: false,
                    //     list: items,
                    //     modalVisible: false
                    // })
                }
            }).catch(e => {
                that.setState({
                    isSending: false,
                    modalVisible: false
                })
                // that._setModalVisible(false)
                alert('留言失败，稍后再试!' + e)
            })
        }
        )
    }
    // 获取焦点
    _focus() {
        this._setModalVisible(true)
    }
    _closeModal() {
        this._setModalVisible(false)
    }
    _setModalVisible(visible) {
        this.setState({
            modalVisible: visible
        })
    }
    render() {
        var data = this.props.data
        return (
            <View style={styles.container} >
                {this._renderNav()}
                < View style={styles.videoBox} >
                    <Video
                        ref='videoPlayer'
                        source={{ uri: util.video(config.debug ? data.video : data.cloudinary_video) }}
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
                    {/* loading bar */}
                    {
                        !videoPlayState.videoLoaded && <ProgressBarAndroid style={styles.loading} />
                    }
                    {/* 重播 */}
                    {
                        videoPlayState.videoLoaded && !videoPlayState.playing
                            ? <VectorIcon name='play' size={50} style={styles.playIcon}
                                onPress={this._rePlay}
                            ></VectorIcon>
                            : null
                    }
                    {/* 暂停 */}
                    {
                        videoPlayState.videoLoaded && videoPlayState.playing
                            ? <TouchableOpacity onPress={this._pause.bind(this)}
                                style={styles.pauseBtn}>
                                {
                                    this.state.paused
                                        ? <VectorIcon onPress={this._resume.bind(this)}
                                            name='play' size={50} style={styles.resumeIcon} />
                                        : null
                                }
                            </TouchableOpacity>
                            : null
                    }
                    {/* 视频出错 */}
                    {
                        !this.state.videoOk && <Text style={style.failText}>视频出错了!很抱歉</Text>
                    }
                    {/* 进度条 this.state.videoProgress */}
                    <View style={styles.progressBox}>
                        <View style={[styles.progressBar, {
                            width: width * videoPlayState.videoProgress
                        }]}>
                        </View>
                    </View>
                </View >
                {this._renderComments()}
            </View >
        )
    }
    componentDidMount() {
        var that = this
        AsyncStorage.getItem('user')
            .then((data) => {
                var user
                if (data) {
                    user = JSON.parse(data)
                }
                if (user && user.accessToken) {
                    that.setState({
                        user: user
                    }, () => {
                        that._fetchData(1)
                    })
                }
            })
    }
    _fetchData(page) {
        this.setState({
            isLoadingTail: true
        })
        var that = this
        let params = {
            accessToken: this.state.user.accessToken,
            creation: this.state.data._id,
            page: page
        }
        var url = config.api.base + config.api.comments
        request.get(url, params).then(
            (data) => {
                if (data && data.success) {
                    if (data.data.length > 0) {
                        var items = cacheResults.items.slice();

                        items = items.concat(data.data);
                        cacheResults.nextPage += 1;
                        cacheResults.items = items;
                        cacheResults.total = data.total;

                        setTimeout(() => {
                            that.setState({
                                isLoadingTail: false,
                                list: items
                            })
                        }, 20)
                    }

                }
            }).catch(error => {
                console.log(error)
                that.setState({
                    isLoadingTail: false,
                })
            });
    }
    _renderRow(row) {
        return (
            <View key={row._id} style={styles.replyBox}>
                <Image
                    style={styles.replyAvatar}
                    source={{ uri: util.avatar(row.replyBy.avatar) }}
                ></Image>
                <View style={styles.rely}>
                    <Text style={styles.replyNickname}>
                        {row.replyBy.nickname}
                    </Text>
                    <Text style={styles.replyContent}>
                        {row.content}
                    </Text>
                </View>
            </View>
        )
    }
    // 加载更多数据
    _onEndReached() {
        if (!this._hasMore() || this.state.isLoadingTail) {
            return;
        }
        var page = cacheResults.nextPage;
        this._fetchData(page);
    }
    _hasMore() {
        return cacheResults.items.length !== cacheResults.total;
    }
    _renderFooter() {
        if (!this._hasMore() && cacheResults.total !== 0) {
            return (
                <View styles={styles.loadingMore}>
                    <Text styles={styles.loadingText}>没有更多了</Text>
                </View>
            )
        }
        if (!this.state.isLoadingTail) {
            return <View styles={styles.loadingMore} />
        }
        return (
            <View>
                {/* <ProgressBarAndroid /> */}
            </View>
        )
    }
    _goBackList() {
        this.props.navigator.pop();
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        width: width,
        height: 64,
        // paddingTop: 20,
        paddingLeft: 10,
        paddingRight: 10,
        borderBottomWidth: 1,
        borderColor: 'rgba(0,0,0,1)',
        backgroundColor: '#fff'
    },
    // 评论区 
    listHeader: {
        width: width,
        marginTop: 10
    },
    commentBox: {
        marginTop: 10,
        marginBottom: 5,
        padding: 8,
        width: width
    },
    content: {
        paddingLeft: 2,
        color: '#333',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 4,
        fontSize: 14,
        height: 80
    },
    commentArea: {
        width: width,
        paddingBottom: 6,
        paddingLeft: 10,
        paddingRight: 10,
        // borderWidth: 1,
        // borderBottomColor: '#ccc'
    },
    modalContainer: {
        flex: 1,
        paddingTop: 45,
        backgroundColor: '#fff'
    },
    closeIcon: {
        alignSelf: 'center',
        fontSize: 30,
        color: '#ee753c'
    },
    submitBtn: {
        width: width - 20,
        padding: 16,
        marginTop: 30,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#ee753c',
        borderRadius: 4,
        fontSize: 18,
        color: '#ee753c'
    },
    backBox: {
        position: 'absolute',
        left: 12,
        // top: 32,
        width: 50,
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerTitle: {
        width: width - 120,
        textAlign: 'center'
    },
    backIcon: {
        color: '#999',
        fontSize: 20,
        marginRight: 5
    },
    backText: {
        color: '#999'
    },
    infoBox: {
        width: width,
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 10
    },
    avatar: {
        width: 60,
        height: 60,
        marginRight: 10,
        marginLeft: 10,
        borderRadius: 30
    },
    descBox: {
        flex: 1
    },
    nickname: {
        fontSize: 18
    },
    title: {
        marginTop: 8,
        fontSize: 16,
        color: '#666'
    },
    videoBox: {
        width: width,
        height: width * 0.56
    },
    video: {
        width: width,
        height: width * 0.56,
        backgroundColor: '#000'
    },
    loading: {
        position: 'absolute',
        left: 0,
        top: 80,
        width: width,
        alignSelf: 'center',
        backgroundColor: 'transparent'
    },
    progressBox: {
        width: width,
        height: 2,
        backgroundColor: '#ccc'
    },
    progressBar: {
        width: 1,
        height: 2,
        backgroundColor: '#ff6600'
    },
    playIcon: {
        position: 'absolute',
        top: 90,
        left: width / 2 - 15,
        width: 60,
        height: 60,
        paddingTop: 8,
        paddingLeft: 9,
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        color: '#ed7b66'
    },
    pauseBtn: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: width,
        height: 360
    },
    resumeIcon: {
        position: 'absolute',
        top: 80,
        left: width / 2 - 30,
        width: 60,
        height: 60,
        paddingTop: 8,
        paddingLeft: 9,
        backgroundColor: 'transparent',
        borderColor: '#fff',
        borderWidth: 1,
        borderRadius: 30,
        color: '#ed7b66'
    },
    failText: {
        position: 'absolute',
        left: 0,
        top: 90,
        width: width,
        textAlign: 'center',
        color: '#fff',
        backgroundColor: 'transparent'
    },
    replyBox: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginTop: 10
    },
    replyAvatar: {
        width: 40,
        height: 40,
        marginRight: 10,
        marginLeft: 10,
        borderRadius: 20
    },
    replyNickname: {
        color: '#666'
    },
    replyContent: {
        marginTop: 4,
        color: '#666'
    },
    reply: {
        flex: 1
    }
})
module.exports = Detail