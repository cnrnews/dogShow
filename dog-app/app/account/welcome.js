import React, { Component } from 'react'
import App from '../../App'
import Swiper from 'react-native-swiper'
var Dimensions = require('Dimensions');
var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;
import {
    StyleSheet,
    View,
    Text,
    Image,
    ImageBackground,
    Button,
} from 'react-native'

var banners = [
    require('../assets/images/1.jpg'),
    require('../assets/images/2.jpg'),
    require('../assets/images/3.jpg')
]

export default class SwiperComponent extends Component {
    constructor(props) {
        super(props)
        this._goHome = this._goHome.bind(this)
    }
    // 首页
    _goHome() {
        this.props.enterSlide()
    }
    render() {
        return (
            <Swiper style={styles.wrapper}>
                <View style={styles.slide}>
                    <Image source={banners[0]} style={styles.img} />
                </View>
                <View style={styles.slide}>
                    <Image source={banners[1]} style={styles.img} />
                </View>
                <View style={styles.slide}>

                    <ImageBackground source={banners[2]}
                        style={styles.img}
                    >
                        <Button style={styles.btn} onPress={this._goHome.bind(this)} title='立即体验' />

                    </ImageBackground>
                </View>
            </Swiper>
        )
    }
}
const styles = StyleSheet.create({
    slide: {
        flex: 1,
        // justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#9DD6EB'
    },
    img: {
        width: width,
        height: height,
    },
    btn: {
        position: 'absolute',
        width: width - 20,
        left: 10,
        bottom: 60,
        height: 50,
        padding: 10,
        backgroundColor: '#ee735c',
        borderColor: '#ee735c',
        borderWidth: 1,
        fontSize: 18,
        borderRadius: 3
    }
})
module.exports = SwiperComponent