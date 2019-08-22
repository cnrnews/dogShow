# 项目说明
项目基于[慕课网－react native贯穿全栈开发app](https://coding.imooc.com/class/56.html)
## client
客户端项目，windows环境下开发，Android版本
## server
服务器项目，基于nodejs、koa、mongodb开发

# 项目启动
## client
* 搭建Windows下react native开发环境，[官方文档](https://reactnative.cn/docs/0.43/getting-started/)
* ``npm install``，也可使用[淘宝镜像](http://npm.taobao.org/)
* ``npm -g install rnpm`` ``rnpm link react-native-image-picker`` ``rnpm link react-native-audio``
* ``react-native run-android``

## server
* 安装mongodb并启动
* ``node app``

# 截图
## 视频
### 视频列表
视频列表暂时使用阿里的rap接口假数据，包括的功能：
* 下拉更新
* 上拉加载更多
* 点赞
* 点击视频进入详情

![](https://github.com/cnrnews/dogShow/img/list/list.png)

### 视频详情

* 播放视频
* 点击评论框进入评论
* 评论列表

![](https://github.com/cnrnews/dogShow/img/list/detail.png)

### 评论
![](https://github.com/cnrnews/dogShow/img/list/comment.png)

## 创作
创作目前没有做完，大概的思路如下：
* 视频上传到七牛，利用七牛api生成静音视频，同步到服务器并上传到cloudinary
* 音频上传到cloudinary
* 利用cloudinary的api将视频和音频进行合并

![](https://github.com/cnrnews/dogShow/img/creation/edit-1.gif)
![](https://github.com/cnrnews/dogShow/img/creation/edit-2.gif)

## 我

### 首页
![](https://github.com/cnrnews/dogShow/img/account/index.png)

### 注册
![](https://github.com/cnrnews/dogShow/img/account/register.png)

### 修改资料
![](https://github.com/cnrnews/dogShow/img/account/edit.png)