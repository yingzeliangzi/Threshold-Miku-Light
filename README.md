# Threshold-Miku Light

> 一款以初音未来为主题的 Steam 亮色皮肤，基于 [SFP](https://github.com/PhantomGamers/SFP)。

---

## 预览

### 游戏库
![Library](screenshots/library.png)

### 游戏详情
![Game](screenshots/game.png)

### 好友列表 & 聊天
| 好友列表 | 聊天窗口 |
|----------|----------|
| ![Friends](screenshots/friends.png) | ![Chat](screenshots/chat.png) |

### 设置页面
![Settings](screenshots/settings.png)

### 下载页面
![Download](screenshots/download.png)

---

## 简介

Threshold-Miku Light 是一款适配 Steam 客户端的亮色系主题皮肤，以 **初音未来** 的经典青绿配色（`#39C5BB`）为主调，将 Steam 默认的深色 UI 改造为清新明亮的轻透明风格。皮肤覆盖游戏库、好友列表、聊天窗口、设置页面、下载页面等所有主要界面，并针对 Steam 的 ReactVirtualized 虚拟列表做了 JavaScript 动态注入处理，确保收藏夹、分组标题等动态渲染元素也能正确应用主题样式。(转人工)

---

## 使用方法

### 前置要求

- [SFP](https://github.com/PhantomGamers/SFP) — Steam 皮肤加载器（支持 CSS/JS 注入）
- [Millennium](https://steambrew.app/) — 你要是想用这个也可以，但是我不太懂，我本人一直在用的是SFP

### 安装步骤

1. 下载本仓库，将 `Miku` 文件夹放入 Steam 皮肤目录：
   ```
   Steam\steamui\skins\
   ```
2. 打开 SFP → Settings → Steam Skin → 选择 **Miku**（如果是 Millennium 则选择**Threshold-Miku-Light**)。
3. 勾选 **注入CSS** 和 **注入Javascript**。
4. 重启 Steam。

### 文件结构

```
Miku/
├── skin.json               # Millennium 皮肤配置（CSS/JS 注入规则）
├── global.css              # 全局变量、字体、鼠标指针
├── css/
│   ├── steam.css           # 主界面（游戏库、对话框等）
│   ├── friends.custom.css  # 好友列表 & 聊天窗口
│   ├── menus.css           # 顶栏菜单
│   ├── supernavs.css       # 顶部导航栏
│   ├── settings.css        # 设置页面
│   ├── webkit.css          # 全局 WebKit 样式
│   └── store.steampowered.com.css
├── js/
│   ├── steam.js            # 游戏库动态注入（MutationObserver）
│   ├── friends.custom.js   # 好友列表动态注入
│   └── webkit.js
├── fonts/
│   └── PingFang SC.ttc     # 全局字体
└── imgs/
    ├── mainBG.jpg          # 游戏库主背景
    ├── friendsBG.jpg       # 好友列表背景
    ├── chatBG.jpg          # 聊天窗口背景
    ├── loginBG.jpg         # 登录页背景
    ├── settingsBG.jpg      # 设置页背景
    ├── downloadBG.jpg      # 下载页背景
    ├── musicBG.jpg         # 音乐页背景
    └── cursor.png          # 自定义鼠标指针
```

---

## 美化内容一览

### 全局
| 项目 | 说明 |
|------|------|
| 字体 | 全局替换为 **PingFang SC**，Fallback 为 Segoe UI / Microsoft YaHei (你们不觉得苹方很好看吗) |
| 鼠标指针 | 自定义 PNG 指针 |
| 滚动条 | 细化(6px)、圆角、半透明亮蓝色 |
| 配色主调 | 青绿 `#39C5BB` 作为强调色，所有高亮/选中/边框均统一 |

### 游戏库
| 项目 | 说明 |
|------|------|
| 主背景 | `mainBG.jpg` 全页铺底，各面板透明叠加 |
| 左侧边栏 | 半透明白色背景 + 毛玻璃模糊效果 |
| 游戏选中 | 青绿半透明高亮 `rgba(57,197,187,0.30)` |
| 游戏悬停 | 青绿浅色高亮 `rgba(57,197,187,0.15)` |
| 收藏夹标题行 | 青绿底色 + 黑色字体（JS 动态注入） |
| 收藏夹名称 | 黑色字体，透明背景 |
| What's New | 已隐藏 (没有人会喜欢这个What's New吧!!!) |
| 对话框 | 浅蓝背景 + 黑色字体 + 青绿按钮，遮罩层改为半透明毛玻璃 |

### 好友列表
| 项目 | 说明 |
|------|------|
| 背景 | `friendsBG.jpg` 独立背景 |
| 好友条目 | 半透明白色底色 + 轻微模糊 |
| 好友悬停 | 青绿浅色高亮 |
| 分组标题 | Online Friends / Offline / In-Game 等均有青绿半透明底色（JS 动态注入） |

### 聊天窗口
| 项目 | 说明 |
|------|------|
| 背景 | `chatBG.jpg` 独立背景，与好友列表分离 |
| 消息气泡 | 他人消息：白色圆角气泡；自己消息：青绿渐变气泡 |
| 标签栏 | 选中标签青绿高亮 + 底部分隔线 |
| 工具栏按钮 | 表情、附件、语音按钮统一为白色圆角卡片 + 青绿图标 |
| 输入框 | 白色半透明背景 + 青绿边框 |

### 设置页面
| 项目 | 说明 |
|------|------|
| 背景 | `settingsBG.jpg` 背景图 |
| 面板 | 半透明白色卡片 |

---

## BUG

目前项目仍存在许多小问题，自从Steam哈希了class后不再方便查找选择器。目前发现的问题有：

- 库-左侧列表 收藏夹名称为白色字体，与底色混合看不清
- 库-左侧列表 收藏夹名称的上面一款游戏底色被额外添加了底色
- 库-游戏详情 PLAY为青色字体，与底色混合看不清
- 库-游戏详情 右侧卡片部分字体不为青色
- 好友列表 并不美观，但是不知道该如何美化

---

## 致谢

- 灵感来源：[Threshold-Miku by Jack-Myth](https://github.com/Jack-Myth/Threshold-Miku) (在Steam更改为Chromium内核之前一直在使用的皮肤，时隔接近3年，特此还原)
- 框架来源：[blueArchiveSteamSkin by EugeneXXXie](https://github.com/EugeneXXXie/blueArchiveSteamSkin)
