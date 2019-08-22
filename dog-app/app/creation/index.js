import React, { Component } from 'react';
import VectorIcon from 'react-native-vector-icons/EvilIcons';
import IonIos from 'react-native-vector-icons/Ionicons';


var config = require('../common/config')
var util = require('../common/util')
var request = require('../common/request')

var Detail = require('./detail')

var Dimensions = require('Dimensions');
var sWidth = Dimensions.get('window').width;

import {
    StyleSheet,
    View,
    Text,
    Image,
    ImageBackground,
    FlatList,
    AsyncStorage,
    TouchableOpacity,
    ProgressBarAndroid,
    RefreshControl

} from 'react-native'
var cacheResults = {
    nextPage: 1,
    items: [],
    total: 0
}
class Item extends React.Component {
    constructor(props) {
        super(props);
        this._goToDetail = this._goToDetail.bind(this)
        var row = this.props.row
        this.state = {
            up: row.voted,
            row: row
        }
    }
    // 喜欢
    _up() {
        var url = config.api.base + config.api.up
        var row = this.state.row
        var up = !this.state.up
        var body = {
            id: row._id,
            up: up ? 'yes' : 'no',
            accessToken: 'acdee'
        }
        request.post(url, body).then((jsonData) => {
            if (jsonData && jsonData.success) {
                this.setState({
                    up: up
                })
            } else {
                alert('点赞失败，稍后重试')
            }
        }).catch(error => {
            alert('点赞失败，稍后重试')
        })
    }
    _goToDetail(item) {
        this.props.onSelect(item)
    }
    render() {
        var item = this.state.row
        return (
            <TouchableOpacity onPress={
                this._goToDetail.bind(this, item)
            }>
                <View style={styles.item}>
                    <Text style={styles.title}>{item.title}</Text>
                    <ImageBackground source={{uri: util.thumb(config.debug ? item.thumb : item.qiniu_thumb?item.qiniu_thumb:
                        item.cloudinary_thumb)}} style={styles.thumb}>
                        <VectorIcon name='play' size={50} style={styles.play}></VectorIcon>
                    </ImageBackground>
                    <View style={styles.itemFooter}>
                        <View style={styles.handleBox}>
                            <IonIos name={this.state.up ? 'ios-heart' : 'ios-heart-empty'}
                                size={50} style={this.state.up ? styles.down : styles.up}></IonIos>
                            <Text style={styles.handleText} onPress={this._up.bind(this)}>喜欢</Text>
                        </View>
                        <View style={styles.handleBox}>
                            <VectorIcon name='comment' size={50} style={styles.commentIcon}></VectorIcon>
                            <Text style={styles.handleText}>评论</Text>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }
}
class List extends Component {
    constructor(props) {
        super(props);
        this._loadPage = this._loadPage.bind(this);
        this.state = {
            isLoadingTail: false,
            isRefreshing: false,
            list: []
        }
    }
    _fetchData(page) {
        if (page != 0) {
            this.setState({
                isLoadingTail: true
            })
        } else {
            this.setState({
                isRefreshing: true
            })
        }
        var user = this.state.user
        var that = this
        var params = {
            accessToken: user.accessToken,
            page: page
        }
        var url = config.api.base + config.api.creations
        request.get(url, params).then((data) => {
            if (data && data.success) {
                if (data.data.length > 0) {
                    data.data = data.data.map((item) => {
                        var votes = item.votes || []
                        if (votes && votes.indexOf(user._id) > -1) {
                            item.voted = true
                        } else {
                            item.voted = false
                        }
                        return item
                    })
                    var items = cacheResults.items.slice();
                    if (page != 0) {
                        items = items.concat(data.data);
                        cacheResults.nextPage += 1;
                    } else {
                        items = data.data.concat(items);
                    }
                    cacheResults.items = items;
                    cacheResults.total = data.total;
                    // setTimeout(() => {
                    if (page != 0) {
                        that.setState({
                            isLoadingTail: false,
                            list: items
                        })
                    } else {
                        that.setState({
                            isRefreshing: false,
                            list: items
                        })
                    }
                    // }, 20)
                }else{
                    if (page != 0) {
                        that.setState({
                            isLoadingTail: false,
                        })
                    } else {
                        that.setState({
                            isRefreshing: false,
                        })
                    }
                }

            }
        }).catch(error => {
            if (page != 0) {
                that.setState({
                    isLoadingTail: false,
                })
            } else {
                that.setState({
                    isRefreshing: false,
                })
            }
        });
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
            }).catch((err)=>{
                alert(err)
            })
    }
    render() {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>列表页面</Text>
                </View>
                <FlatList
                    data={this.state.list}
                    keyExtractor={(item, index) => String(index)}
                    ListFooterComponent={this._renderFooter()}
                    onEndReached={this._onEndReached.bind(this)}
                    onEndReachedThreshold={20}
                    showsVerticalScrollIndicator={false}
                    renderItem={({ item }) => this.renderItem(item)}
                    //为刷新设置颜色
                    refreshControl={
                        <RefreshControl
                            refreshing={this.state.isRefreshing}
                            onRefresh={this.handleRefresh.bind(this)}
                            colors={['#ff0000', '#00ff00', '#0000ff', '#3ad564']}
                            progressBackgroundColor="#ffffff"
                        />
                    }
                />
            </View>
        )
    }
    _renderFooter() {
        if (!this._hasMore() && cacheResults.total !== 0) {
            return (
                <View styles={styles.loadingMore}>
                    <Text styles={styles.loadingText}>没有更多了</Text>
                </View>
            )
        }
        // 正在下拉刷新
        if (this.state.isRefreshing) {
            return
        }
        if (!this.state.isLoadingTail) {
            return <View styles={styles.loadingMore} />
        }
        return (
            <View>
                <ProgressBarAndroid />
            </View>
        )
    }
    // 下拉刷新
    handleRefresh = () => {
        if (this.state.isRefreshing) {
            return
        }
        this._fetchData(0)
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
    _loadPage(data) {
        const { navigator } = this.props;
        if (navigator) {
            navigator.push({
                name: 'detail',
                component: Detail,
                params: {
                    data: data
                }
            })
        }
    }
    renderItem(row) {
        return (
            <Item
                user={this.state.user}
                key={row._id}
                row={row}
                onSelect={() => this._loadPage(row)}
            />
        )
    }
    renderListDivider() {
        return (
            <View style={styles.divider}>
            </View>
        )
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1
    },
    header: {
        height: 50,
        backgroundColor: '#ee735c',
        alignItems: 'center',
        alignContent: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        paddingTop: 12,
        color: '#fff'
    },
    divider: {
        height: 1,
        color: '#6c6c6c'
    },
    item: {
        width: sWidth,
        marginBottom: 10,
        backgroundColor: '#fff'
    },
    thumb: {
        width: sWidth,
        height: sWidth * 0.5,
        resizeMode: 'cover'
    },
    title: {
        padding: 10,
        fontSize: 18,
        color: '#333'
    },
    itemFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: '#eee'
    },
    handleBox: {
        padding: 10,
        flexDirection: 'row',
        width: sWidth / 2 - 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#fff'
    },
    play: {
        position: 'absolute',
        bottom: 14,
        right: 14,
        width: 46,
        height: 46,
        backgroundColor: 'transparent',
        // borderColor: '#fff',
        // borderWidth: 1,
        // borderRadius: 23,
        color: 'white'
    },
    handleText: {
        paddingLeft: 12,
        fontSize: 18,
        color: '#333'
    },
    up: {
        fontSize: 22,
        color: '#333'
    },
    down: {
        fontSize: 22,
        color: 'pink'
    },
    commentIcon: {
        fontSize: 22,
        color: '#333'
    },
    loadingMore: {
        marginVertical: 20
    },
    loadingText: {
        color: '#777',
        textAlign: 'center'
    }
})
module.exports = List