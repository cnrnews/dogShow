import React, { Component } from 'react';

var config = require('../common/config')
var request = require('../common/request')
import {
    StyleSheet,
    TextInput,
    View,
    Text,
    Button
} from 'react-native'
// import CountDownText from 'react-native-sk-countdown'
// import LCCountDownButton from 'react-native-countdownbutton'
import CountDown from 'react-native-countdown-component';

class Login extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            verifyCode: '',
            phoneNumber: '',
            countingDone: false,
            codeSend: false
        }
        this._showVerfiyCode = this._showVerfiyCode.bind(this)
        this._countingDone = this._countingDone.bind(this)
        this._sendVerifyCode = this._sendVerifyCode.bind(this)
        this._submit = this._submit.bind(this)
    }
    // 显示验证码
    _showVerfiyCode() {
        this.setState({
            codeSend: true
        })
    }
    _countingDone() {
        this.setState({
            countingDone: true
        })
    }
    // 发送验证码
    _sendVerifyCode() {
        var phoneNumber = this.state.phoneNumber
        if (!phoneNumber) {
            return alert('手机号不能为空！')
        }
        var that = this
        var body = {
            phoneNumber: phoneNumber
        }
        var url = config.api.base + config.api.signup
        request.post(url, body)
            .then((data) => {
                if (data && data.success) {
                    // 显示验证码输入框
                    that._showVerfiyCode();
                }
                else {
                    alert('获取验证码失败，请检查手机号是否正确')
                }
            })
            .catch((err) => {
                alert('获取验证码失败，请检查网络是否良好'+err)
            })
    }
    _submit() {
        var that = this
        var phoneNumber = this.state.phoneNumber
        var verifyCode = this.state.verifyCode
        if (!phoneNumber || !verifyCode) {
            return alert('手机号或验证码不能为空！')
        }
        var body = {
            phoneNumber: phoneNumber,
            verifyCode: verifyCode
        }
        var url = config.api.base + config.api.verify
        request.post(url, body).then((data) => {
            if (data && data.success) {
                that.props.afterLogin(data.data)
            } else {
                alert('获取验证码失败，请检查手机号是否正确')
            }
        }).catch(e => {
            alert('获取验证码失败，请检查网络是否良好')
        })
    }
    render() {
        return (
            <View style={styles.container}>
                <View style={styles.signupBox}>
                    <Text style={styles.title}>快速登录</Text>
                    <TextInput
                        placeholder='输入手机号'
                        autoCapitalize={'none'}
                        autoCorrect={false}
                        keyboardType={'phone-pad'}
                        style={styles.inputField}
                        onChangeText={(text) => {
                            this.setState({
                                phoneNumber: text
                            })
                        }}
                    />
                    <TextInput
                                    placeholder='请输入验证码'
                                    autoCapitalize={'none'}
                                    autoCorrect={false}
                                    keyboardType={'number-pad'}
                                    style={styles.inputField}
                                    onChangeText={(text) => {
                                        this.setState({
                                            verifyCode: text
                                        })
                                    }}
                                />
                    {/* {
                        this.state.codeSend
                            ? <View style={styles.verifyCodeBox}>
                                <TextInput
                                    placeholder='请输入验证码'
                                    autoCapitalize={'none'}
                                    autoCorrect={false}
                                    keyboardType={'number-pad'}
                                    style={styles.inputField}
                                    onChangeText={(text) => {
                                        this.setState({
                                            verifyCode: text
                                        })
                                    }}
                                />

                                {

                                    this.setState.countingDone
                                        ? <Button
                                            style={styles.countBtn}
                                            onPress={this._sendVerifyCode}
                                            title='获取验证码'
                                        />
                                        : <CountDown
                                            style={styles.countBtn}
                                            until={60}
                                            running={this.state.codeSend}
                                            onFinish={() => {
                                                this._countingDone()
                                            }}
                                            digitStyle={{ backgroundColor: '#ee735c' }}
                                            digitTxtStyle={{ color: 'white' }}
                                            timeToShow={['S']}
                                        />
                                }
                            </View>
                            : null
                    } */}
                     <Button style={styles.btn} onPress={this._submit} title='登录' />
                    {/* {
                        this.state.codeSend
                            ? <Button style={styles.btn} onPress={this._submit} title='登录' />
                            : <Button style={styles.btn} onPress={this._sendVerifyCode} title='获取验证码' />
                    } */}
                </View>
            </View>
        );
    }
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    signupBox: {
        marginTop: 30,
    },
    title: {
        // marginBottom: 20,
        color: '#6c6c6c',
        fontSize: 20,
        textAlign: 'center'
    },
    inputField: {
        height: 40,
        padding: 5,
        color: '#666',
        fontSize: 16,
        backgroundColor: '#fff',
        borderRadius: 4
    },
    verifyCodeBox: {
        marginTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    countBtn: {
        width: 110,
        height: 40,
        padding: 10,
        marginLeft: 8,
        backgroundColor: '#ee735c',
        borderColor: '#ee735c',
        textAlign: 'left',
        fontWeight: '600',
        fontSize: 15,
        color: '#fff',
        borderRadius: 2
    },
    btn: {
        padding: 10,
        marginTop: 48,
        backgroundColor: '#ee735c',
        borderWidth: 1,
        borderRadius: 4,
        color: '#ee735c'
    }
})
export default Login;