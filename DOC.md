## 插件 loader 变更记录

### 2019-08-07

#### changes
- propWillUpdate 的**三个参数已恢复，需要仔细测试**
- 面板控件的条件上下文，**已恢复为经过数据源后的数据了**

#### bugfixes
- 错误的监听上下文导致的数据不变更问题

### 2019-08-06

#### changes

- 所有类型的条件函数中的上下文参数，拿到的数值**将不再是经过数据源后的数据**
- 识别纯 Group 的 panel
- Item 第三第四个参数支持不指定
- 新增两种 Group, **TabBoxGroup 以及 EditorBoxGroup**, 安装 arena-types@0.0.8 可导入
- propWillUpdate 的**三个参数在本版本中临时取消**

#### bugfixes

- 面板 pluginData 与插件 loader 回写冲突问题
- 默认值为 (Boolean)false, (Number)0 或 (String)'' 时无法绑定的问题
- 循环 watch 的问题

### 2019-08-05

- **基类 ArenaPluginDOM 将不再默认提供**，需要手动引入，方式如下：

  安装 arena-types 到本地, 并添加代码 import { ArenaPluginDOM } from 'arena-types';

  生命周期以及其他内置对象无变更

- 为了支持动态的面板设置，0.1 的插件系统的 **config 字段以及相应的 json 配置已经无效**

  如 plugin.json 中配置的 config 字段以及其指向的文件均已无效，详细面板选项设置请往后阅读

  

## 插件 0.2.1 开发文档

### 插件配置文件 plugin.json 

```json
{
  "name": "Arena 官方默认图表插件",
  "pluginId": "official.arena.charts",
  "author": "Arena",
  "description": "Arena 官方插件图表插件",
  "version": "0.0.1",
  "main": "app/index.js",
  "plugins": [
    {
      "name": "bar",
      "export": "bar",
      "icon": "app/index.jpg"
    }
  ],
}
```

name： 插件包名称

pluginId: 插件ID， 如果无，则默认为 plugin.json 所在目录的 md5

author: 插件作者

description: 插件描述

version: 插件版本

main: 插件入口文件

plugins: 插件列表，

[ **{ **

**name: 插件的名称 （下拉列表显示的名称）, **

**export: 在入口文件中，该插件 export 的变量名称, **

**icon: 图标路径，自动压缩为 64x64**

**}**]



当配置 plugin.json 结束之后，可以通过 CLI 运行 **arena-plugin-cli dev** 即可



#### CLI 的安装

`npm install arena-plugin-cli -g`

#### Troubleshoot

- dev 之后没更新： 可能的问题： 1. 9999 端口被占用 2. 插件包名不符合 Android 包名规范



### 插件的样式

插件的样式可以在 style 目录下新建与 export 配置同名的 scss 样式文件即可自动编译



### 插件的生命周期

对于插件，需要首先**继承 ArenaPluginDOM**, 从 **arena-types** 包中导入，支持的生命周期如下：

**onMounted**: 插件的 DOM 已经生成并挂载

**onDestroy**: 插件即将卸载

**propWillUpdate**(target: string, oldValue: any, newValue: any): 数据更新，target 表示更新的根级key的名称

如果需要 onMounted 之前的生命周期，可以写入类的 constructor 中



### 插件的内置对象

在 this 上可以访问到 $arena 对象，对象中包含

**dom**: 插件挂载的 DOM 元素

**data**: 插件的数据

utils.**resolveLocalStatic**: 解析文件名为绝对路径，如果插件设计导入图片的选项，图片的值一定为文件名，如需要使用该文件，必须通过该函数转换成绝对访问路径。



### 插件面板的配置

插件的面板配置需要在 class 上设置一个静态方法 panel

```javascript
import { ArenaPluginDOM } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {}
```

配置的最小元素为 **Item**, 可以由布局 **Layout**  包含，最后由组 **Group** 包含，这三个 class 均可以从 **arena-types** 中导入

例1: 配置一个包含组名为 “文字” 并且有一个内容输入框的面板，并且这个内容可以从 $arena.data.content 中获取到

```javascript
import { ArenaPluginDOM, Group, Item } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {
  const group = new Group('文字')
  const item = new Item('input', 'content')
  group.add(item)
  return [group]
}
```

例2: 配置一个包含组名为 “文字” 并且有一个内容输入框的面板，并且这个内容可以从 $arena.data.content 中获取到， **在内容的同一行，还有字号选项**

```javascript
import { ArenaPluginDOM, Group, Item, Layout } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {
  const group = new Group('文字')
  const textContent = new Item('input', 'content')
  const fontSize = new Item('input', 'size')
  const layout = new Layout()
  // layout 为 12 等分的
  layout.add([[textContent, 6], [fontSize, 6])
  // 也等同于
  // layout.add(textContent, 6)
  // layout.add(fontSize, 6)
  group.add(layout)
  return [group]
}
```

例3：  配置一个包含组名为 “文字” 并且有一个内容输入框的面板，并且这个内容可以从 $arena.data.content 中获取到， 在内容的同一行，还有字号选项，**当字号大于 30 时 内容选项消失**

```javascript
import { ArenaPluginDOM, Group, Item, Layout } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {
  const group = new Group('文字')
  // Item 的第五个参数为一个函数，传入一个上下文，该上下文是当前所有选项的值
  // 如果函数返回 false 该选项隐藏
  const textContent = new Item('input', 'content', {}, {}, $ => $.size < 30)
  const fontSize = new Item('input', 'size')
  const layout = new Layout()
  layout.add([[textContent, 6], [fontSize, 6])
  group.add(layout)
  return [group]
}
```
##### Group 的不同形态
group包含三种形态

第一种形态为普通的折叠面板

第二种形态为带代码块的折叠面板**EditorBoxGroup**, 这种形式的Group需要传EditorBoxGroup的第二个参数, 当前折叠面板的名字, 作用是通过这个名字来获取代码块的值. 如下面的折叠面板通过 $arena.data.text 获得折叠面板代码块中的值. 

```javascript
import { ArenaPluginDOM, EditorBoxGroup, Item } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {
  // 在这里定义为代码块的折叠面板, 同时传递一个name为text
  const group = new EditorBoxGroup('文字', 'text')
  const item = new Item('input', 'content')
  group.add(item)
  return [group]
}
```
第三种形态为带tab切换的折叠面板**TabBoxGroup**, 这种形式的Group需要在给组件传递value的时候传递一个value数组, 数组的长度将设定为tab页的数量. 如下的tab页数量为两个, 每一个tab页有一个文字的input, 第一个tab中的input的值为'文字1', 第二个的值为'文字2'.

```javascript
import { ArenaPluginDOM, TabBoxGroup, Item } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {
  // 在这里定义为tab页的折叠面板
  const group = new TabBoxGroup('文字')
  const item = new Item('input', 'content')
  group.add(item)
  return [group]
}
Text.presets = {
  // 在传递初始值的时候传递一个值的数组
  content: ['文字1', '文字2']
}
```

##### Item 的第三个参数

该参数为选项展示类的参数

showLabel, label 在控件下方展示标签

showTitle, title 在控件左方展示标签

##### Item 的第四个参数

第四个参数为给控件传入的参数，可以传入的参数依照控件类型不同而不同，具体请看下一小节



#### 插件的默认配置数值

插件的默认配置挂载静态属性 presets 即可

```javascript
import { ArenaPluginDOM, Group, Item } from 'arena-types'
class Text extends ArenaPluginDOM {}
Text.panel = () => {
  const group = new Group('文字')
  const item = new Item('input', 'content')
  group.add(item)
  return [group]
}

Text.prestes = {
  content: '请输入内容'
}
```



#### 当前面板中支持的控件类型以及选项

##### input  多功能输入框

| 参数        | 类型      | 说明             | 默认值    |
| :---------- | :-------- | :--------------- | :-------- |
| unit        | `String`  | 单位             |           |
| toFixed     | `Number`  | 保留小数         | 0         |
| placeholder | `String`  | 输入框占位文本   |           |
| schema      | `Object`  | 数据校验（必须） |           |
| enableDomId | `String`  | 滑块有效区       | inspector |
| readonly    | `Boolean` | 是否只读         | false     |

##### textarea

| 参数 | 说明 | 类型     | 默认值 |
| ---- | ---- | -------- | ------ |
| rows | 行数 | `Number` | `1`    |

##### radio

| 参数    | 说明                                    | 类型     | 默认值   |
| ------- | --------------------------------------- | -------- | -------- |
| display | radio 展示的内容，可选项有 name 和 icon | `String` | `100`    |
| options | 可选列表                                | 数组     | `name`   |
| type    | radio 类型，目前可选 button             | radio    | `String` |

##### selector 下拉菜单

| 参数        | 说明                           | 类型      | 默认值   |
| ----------- | ------------------------------ | --------- | -------- |
| multiple    | 是否多选                       | `Boolean` | `false`  |
| options     | 可选参数列表                   | `Array`   | -        |
| placeholder | 默认提示                       | `String`  | `请选择` |
| maxHeight   | 下拉选框的最大高度，超出将滚动 | `Number`  | -        |

##### slider 滑动

| 参数    | 说明       | 类型     | 默认值 |
| ------- | ---------- | -------- | ------ |
| max     | 最大值     | `Number` | `100`  |
| min     | 最小值     | `Number` | `0`    |
| toFixed | 精确小数位 | `Number` | `1`    |

##### panel 色彩以及图像选择面板

| key             | value  | 说明                                                         |
| --------------- | ------ | ------------------------------------------------------------ |
| type            | String | [必填] 说明目前选中的值类型，从`color` `linear` `radial` `conic` `image`选择 |
| color           | String | [选填，组合1] 任意颜色类型均可，当该组合1值全部存在时，自动在tab区域增加 `color`类型面板 |
| gradient-rotate | Number | [选填，组合2] 该旋转将应用在linear和conic上，对渐变角度做出变化。当组合2值全部存在时，自动在tab区域增加`linear` `radial` `conic`类型面板 |
| segments        | Array  | [选填，组合2] 每个数组选项需要包含以下信息 ：1. `id`：分段唯一标识；2. `color`：分段颜色； 3. `offset`: 分段偏移，number类型，取值范围在0-1。要求数组内必须存有2个以上的数据。当组合2值全部存在时，自动在tab区域增加`linear` `radial` `conic`类型面板 |
| url             | String | [选填，组合3] 填充图片的URL， 当组合3值全部存在时，自动在tab区域增加`image`类型面板 |
| fillMethod      | String | [选填，组合3] 图片的填充方式，分为`fill`, `fit`, `repeat`, `repeat-x`, `repeat-y`, `stretch`, 当组合3值全部存在时，自动在tab区域增加`image`类型面板 |

##### switch 开关

| 参数     | 说明           | 类型      | 默认值  |
| -------- | -------------- | --------- | ------- |
| disabled | 是否为禁用状态 | `Boolean` | `false` |
