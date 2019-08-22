import React from 'react';
import { Navigator } from 'react-native-deprecated-custom-components';
import TabNavigator from 'react-native-tab-navigator';

import Login from './app/account/login'
import Account from './app/account/index'
import List from './app/creation/index'
import Edit from './app/edit/index'
import WelCome from './app/account/welcome'


var Dimensions = require('Dimensions');
var width = Dimensions.get('window').width;
var height = Dimensions.get('window').height;

import {
  StyleSheet,
  Image,
  View,
  ProgressBarAndroid,
  AsyncStorage
} from 'react-native'
class App extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      user: null,
      selectedTab: 'list',
      entered: false,//是否加载引导页
      booted: false,//
      logined: false //登录标识
    }
    this._afterLogin = this._afterLogin.bind(this)
  }
  _asyncAppStatus() {
    var that = this



    AsyncStorage.multiGet([
      'user', 'entered'
    ])
      .then((data) => {
        var userData = data[0][1]
        var entered = data[1][1]
        var user
        var newState = {
          booted: true
        }
        if (userData) {
          user = JSON.parse(userData)
        }
        if (user && user.accessToken) {
          newState.user = user
          newState.logined = true
        } else {
          newState.logined = false
        }
        if (entered === 'yes') {
          newState.entered = true
        }
        that.setState(newState)
      })
  }
  componentDidMount() {
    // AsyncStorage.removeItem('entered')
    // AsyncStorage.removeItem('user')
    this._asyncAppStatus()
  }
  // 退出登录
  _logout() {
    console.log('_logout')
    AsyncStorage.removeItem('user')
    this.setState({
      logined: false,
      user: null
    })
  }
  _afterLogin(jsonData) {
    var that = this
    var user = JSON.stringify(jsonData)
    AsyncStorage.setItem('user', user)
      .then(() => {
        that.setState({
          logined: true,
          user: user
        })
      })
  }
  _enterSlide() {
    console.log('_enterSlide')
    this.setState({
      entered: true
    }, () => {
      AsyncStorage.setItem('entered', 'yes')
    })
  }
  render() {
    if (!this.state.booted) {
      return (
        <View style={styles.bootPage}>
          <ProgressBarAndroid />
        </View>
      )
    }
    if (!this.state.entered) {
      return <WelCome enterSlide={this._enterSlide.bind(this)} />
    }

    if (!this.state.logined) {
      return <Login afterLogin={this._afterLogin} />
    }
    return (
      <TabNavigator>
        {/* --主页-- */}
        {this.renderTabNavigatorItem('主页', require('./app/assets/images/video_normal.png'), require('./app/assets/images/video_selected.png'), 'list', 'list', List)}
        {/* --添加-- */}
        {this.renderTabNavigatorItem('添加', require('./app/assets/images/add_normal.png'), require('./app/assets/images/add_selected.png'), 'edit', 'edit', Edit)}
        {/* --我-- */}
        {this.renderTabNavigatorItem('我', require('./app/assets/images/more_normal.png'), require('./app/assets/images/more_selected.png'), 'account', 'account', Account)}
      </TabNavigator>

    )
  }
  renderTabNavigatorItem(title, icon, selectedIcon, selectedTab, componentName, component) {
    return (
      <TabNavigator.Item
        // title={title}
        renderIcon={() => <Image source={icon} style={styles.tabIcon} />}
        renderSelectedIcon={() => <Image source={selectedIcon} style={styles.tabIcon} />}
        onPress={() => { this.setState({ selectedTab: selectedTab }) }}
        selected={this.state.selectedTab === selectedTab}
      >
        {/* <Home></Home> */}
        <Navigator
          initialRoute={{
            name: componentName,
            component: component,
          }}
          configureScene={(route) => {
            return Navigator.SceneConfigs.PushFromRight;
          }}
          renderScene={(route, navigator) => {
            let Component = route.component;
            return <Component {...route.params} navigator={navigator} user={this.state.user} logout={this._logout.bind(this)} />
          }}
        >
        </Navigator>
      </TabNavigator.Item>
    )
  }
}
const styles = StyleSheet.create({
  tabIcon: {
    width: 30,
    height: 30
  },
  bootPage: {
    width: width,
    height: height,
    backgroundColor: '#fff',
    justifyContent: 'center'
  }
});
module.exports = App