## 一、作用
检测 Mpx 项目中没有引用的 mpx 文件，包括 page 和 components;

## 二、用法

#### 2.1 安装

```shell
$ npm i check-unreferenced-mpx -D
```

### 2.2 配置文件
+ 注意文件名必须是 unreferenced-mpx-config.js
```js
const path = require('path')
// 这里需要优化，获取 alias
const webpackBaseCfgAlias = require('./build/webpack.base.conf')({ mode: 'wx' }).resolve.alias;
const extensionList = ['.mpx', '/index.mpx'];
const defs = {
  __application_name__: 'kf',
  __env__: 'normal',
  __use_control_center__: true,
  __web_dev__: false,
  __mpx_mode__: 'wx',
  __TEST_DEV__: false,
  __VERSION__: '1.0.0',
  __MPVERSION__: '1.0.0',
  __OE_BRANCH_NAME__: 'some-branch',
  __mpx_env__: ''
}

const localSrcDir = [
  {
    type: 'dir',
    absolutePath: path.resolve('./src')
  }
]
const entry = [
  { type: 'app', absolutePath: path.resolve(__dirname, './src/app.mpx') }
]
module.exports = {
  webpackBaseCfgAlias,
  extensionList,
  entry,
  localSrcDir,
  defs
}
```

### 2.3 调用

```shell
npx check-unreferenced-mpx
```
