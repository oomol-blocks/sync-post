<div align=center>
  <h1>多平台内容发布器</h1>
  <p>中文 | <a href="./README.md">English</a></p>
</div>

一个基于 OOMOL 的支持多平台内容发布的工具，可以同时发布内容到 Twitter、Telegram 和 LinkedIn（开发中），并自动优化内容格式以适应各平台的限制。

## ✨功能特性

- **多平台支持**: 支持 Twitter、Telegram
- **内容优化**: 自动优化内容格式，确保符合各平台字符限制
- **媒体文件处理**: 支持图片、视频、文档等多种媒体类型
- **智能验证**: 预发布验证，检查内容和媒体文件兼容性
- **批量发布**: 一次配置，多平台同步发布

## 📊平台支持详情

| 平台 | 文本长度限制 | 文件数量限制 | 图片支持 | 视频支持 | 文档支持 |
|------|------------|------------|----------|----------|----------|
| **Twitter** | 280 字符 | 最多4个 | < 5MB<br/>jpg, jpeg, png, webp | < 512MB<br/>mp4, mov | 不支持 ❌ |
| **Telegram** | 4096 字符<br/>*(媒体组 caption: 1024)* | 最多10个 | < 10MB<br/>jpg, jpeg, png, webp | < 50MB<br/>mp4, avi, mov, mkv | < 50MB<br/>pdf, txt, doc, docx, zip |
| **LinkedIn<br/>(开发中)** | 3000 字符 | 最多9个 | < 5MB<br/>jpg, jpeg, png | < 5GB<br/>mp4 | < 100MB<br/>pdf, ppt, pptx, doc, docx |

## `twitter-publisher` 发布到 Twitter

```ts
type Inputs = {
    twitterContent: string;     // 发布内容
    mediaPaths?: string[] | null;   // （可选）媒体文件
    twitterApiKey: string;
    twitterApiSecret: string;
    twitterAccessToken: string;
    twitterAccessTokenSecret: string;
};
```

### 获取 API 认证信息

1. 创建 Twitter Developer 账户
* 访问 [Twitter Developer Portal](https://developer.x.com/en)
* 使用你的 Twitter 账户登录
* 申请开发者账户（可以选注册免费版本）

2. 创建应用程序
* 登录后进入 Developer Portal
* 点击 "Projects & Apps"
* 点击 "Default project-xxx" 进入默认创建的应用

3. 获取 API Keys 和 Tokens
**（1）API Key 和 API Secret Key：**
* 在应用的 "Keys and Tokens" 标签页
* 在 "Consumer Keys" 部分可以找到（如果没有则点击生成）：
    * API Key (对应代码中的 twitterApiKey)
    * API Secret Key (对应代码中的 twitterApiSecret)
**（2）Access Token 和 Access Token Secret**
* 在同一页面的 "Access Token and Secret" 部分
* 点击 "Generate" 生成：
    * Access Token (对应代码中的 twitterAccessToken)
    * Access Token Secret (对应代码中的 twitterAccessTokenSecret)

4. 设置权限
* 在 "App permissions" 中设置为 "Read and Write" 权限
* **如果此前没有设置该项，则设置后需要重新生成 Access Token and Secret**

> Access Token and Secret 下有权限提示 “Created with Read and Write permissions”

### 运行

获取各种密钥后，输入需要发送的内容及上传需要发送的文件，点击 `twitter-post` 节点上的运行按钮即可。

## `telegram-publisher` 发布到 Telegram

```ts
type Inputs = {
    telegramContent: string;
    mediaPaths: any[] | null;
    telegramBotToken: string;
    telegramChannelId: string;
};
```

### 获取 API 认证信息

1. 创建 Telegram Bot
* 在 Telegram 中搜索 `@BotFather`
* 发送 `/newbot` 命令
* 按提示设置 bot 名称和用户名
* 获得 Bot Token（格式如：123456789:ABCdefGHIjklMNOpqrSTUvwxYZ）

2. 获取频道 ID
* 创建一个 Telegram 频道
* 将你的 bot 添加为频道管理员
* 频道 ID 有两种格式：
    * 公开频道：@channelname。
    * 私有频道：数字 ID（如 -1001234567890）

### 获取数字 ID 的方法

* 使用 bot 向频道发送消息，然后调用 getUpdates API
* 或使用在线工具如 @userinfobot 转发频道消息获取 ID创建 Telegram Bot

> 在频道内发送至少一条消息。然后在控制台执行 `curl https://api.telegram.org/bot${your-bot-token}/getUpdates` 其中 id 就是 channel id。

### 运行

获取各种密钥后，输入需要发送的内容及上传需要发送的文件，点击 `telegram-post` 节点上的运行按钮即可。

## ⚙️内容优化规则

### Twitter
- **优化策略**: 移除多余换行符，超出长度时智能截断
- **媒体支持**: 仅支持图片和视频

### Telegram
- **优化策略**: 
  - 标签转为粗体格式 (`#tag` → `*#tag*`)
  - 链接转为 Markdown 格式
  - 媒体组发送失败时自动单个发送
- **媒体支持**: 支持图片、视频、文档

### LinkedIn *(开发中)*
- **优化策略**: 保持专业格式，优化段落结构
- **媒体支持**: 支持图片、视频、文档

## ⚠️重要说明

### 智能跳过机制
- **文本处理**: 超出长度限制时会自动截断，尽量保持剩余内容的完整性
- **媒体处理**: 不符合渠道要求的媒体文件会自动跳过该渠道，其他符合要求的渠道正常发布
- **文件大小**: 建议不要上传过大的文件，网络问题可能导致上传失败
