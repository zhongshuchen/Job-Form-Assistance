# Job Form Assistance

一个 Chrome 浏览器扩展，帮助你快速填写求职申请表单。

## 背景

投递职位时，每个公司的申请系统都不一样，即使准备好了语料素材，手动复制粘贴依然很耗时间。这个插件可以帮你把所有求职素材保存好，点击一下就能快速插入到表单中。

## 功能特性

- 🚪 **侧边栏** - 点击扩展图标从右侧滑出侧边栏，不遮挡页面内容
- 📁 **分组管理** - 素材支持分组，可以展开/折叠，方便整理归类
- ⚡ **快速插入** - 点击素材自动插入到当前激活的文本框，也支持拖拽插入
- ✏️ **编辑管理** - 支持新建分组、新建素材、编辑删除已有素材
- 🏷️ **标签支持** - 素材可以添加可选标签，帮助你快速辨别
- 🔄 **拖动排序** - 支持在分组内拖动排序素材，也支持拖动更换分组
- 🔍 **自动分类** - 使用正则自动识别特殊内容：日期、手机号、邮箱
- 📅 **灵活日期格式** - 支持三种日期粘贴格式：`YYYY`、`YYYY-MM`、`YYYY-MM-DD`，自动补全缺失部分

## 安装方式

### 从网上应用店安装

[Chrome 应用商店](https://chromewebstore.google.com/detail/epggkabcadgpjlnamimpjjpfokpjmpod?utm_source=item-share-cb) | [Edge 扩展商店]（Coming Soon）

### 开发者模式加载（手动安装）

1. 克隆仓库到本地：
```bash
git clone https://github.com/zhongshuchen/Job-Form-Assistance.git
cd Job-Form-Assistance
```

2. 打开 Chrome 浏览器，进入扩展管理页面：
   - 在地址栏输入 `chrome://extensions/` 并回车
   - 或者点击菜单 → 更多工具 → 扩展程序

3. 开启「开发者模式」（右上角开关）

4. 点击「加载已解压的扩展程序」，选择 `job-assistant-extension` 目录

5. 扩展安装完成，现在可以点击浏览器工具栏中的图标使用了

## 使用说明

1. 点击扩展图标打开侧边栏
2. 先创建一个分组（比如「简历」、「求职信」、「个人信息」）
3. 在分组中添加你的素材，填写内容和可选标签
4. 填写求职表单时，点击素材就能插入到当前光标位置
5. 对于日期材料，可以在顶部选择你需要的粘贴格式

## 项目结构

```
job-assistant-extension/
├── background.js       # 后台服务脚本
├── content.js          # 内容脚本（处理页面插入）
├── sidebar.html        # 侧边栏 HTML
├── sidebar.css         # 侧边栏样式
├── sidebar.js          # 侧边栏逻辑
├── i18n.js             # 国际化支持
└── manifest.json       # Chrome 扩展配置
```

## 许可证

MIT
