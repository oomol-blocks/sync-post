<div align=center>
  <h1>Social Media Publisher</h1>
  <p><a href="./README_CN.md">中文</a> | English</p>
</div>

An OOMOL-based multi-platform content publishing tool that can simultaneously publish content to Twitter, Telegram, and LinkedIn (in development), with automatic content format optimization to adapt to each platform's limitations.

## ✨ Features

- **Multi-platform Support**: Supports Twitter and Telegram
- **Content Optimization**: Automatically optimizes content format to comply with character limits on each platform
- **Media File Processing**: Supports various media types including images, videos, and documents
- **Smart Validation**: Pre-publish validation to check content and media file compatibility
- **Batch Publishing**: One-time configuration for multi-platform synchronized publishing

## 📊 Platform Support Details

| Platform | Text Length Limit | File Count Limit | Image Support | Video Support | Document Support |
|----------|------------------|------------------|---------------|---------------|------------------|
| **Twitter** | 280 characters | Max 4 files | < 5MB<br/>jpg, jpeg, png, webp | < 512MB<br/>mp4, mov | Not supported ❌ |
| **Telegram** | 4096 characters<br/>*(Media group caption: 1024)* | Max 10 files | < 10MB<br/>jpg, jpeg, png, webp | < 50MB<br/>mp4, avi, mov, mkv | < 50MB<br/>pdf, txt, doc, docx, zip |
| **LinkedIn<br/>(In Development)** | 3000 characters | Max 9 files | < 5MB<br/>jpg, jpeg, png | < 5GB<br/>mp4 | < 100MB<br/>pdf, ppt, pptx, doc, docx |

## `twitter-publisher` Publish to Twitter

```ts
type Inputs = {
    twitterContent: string;     // Content to publish
    mediaPaths?: string[] | null;   // (Optional) Media files
    twitterApiKey: string;
    twitterApiSecret: string;
    twitterAccessToken: string;
    twitterAccessTokenSecret: string;
};
```

### Getting API Authentication Information

1. Create Twitter Developer Account
* Visit [Twitter Developer Portal](https://developer.x.com/en)
* Log in with your Twitter account
* Apply for developer account (you can choose to register for free version)

2. Create Application
* After logging in, go to Developer Portal
* Click "Projects & Apps"
* Click "Default project-xxx" to enter the default created application

3. Get API Keys and Tokens
**(1) API Key and API Secret Key:**
* In the application's "Keys and Tokens" tab
* Find in the "Consumer Keys" section (click generate if not available):
    * API Key (corresponds to twitterApiKey in code)
    * API Secret Key (corresponds to twitterApiSecret in code)
**(2) Access Token and Access Token Secret**
* In the "Access Token and Secret" section on the same page
* Click "Generate" to create:
    * Access Token (corresponds to twitterAccessToken in code)
    * Access Token Secret (corresponds to twitterAccessTokenSecret in code)

4. Set Permissions
* Set "App permissions" to "Read and Write" permissions
* **If this wasn't set before, you need to regenerate Access Token and Secret after setting it**

> Under Access Token and Secret, there should be a permission notice "Created with Read and Write permissions"

### Running

After obtaining all keys, input the content to send and upload files to send, then click the run button on the `twitter-post` node.

## `telegram-publisher` Publish to Telegram

```ts
type Inputs = {
    telegramContent: string;
    mediaPaths: any[] | null;
    telegramBotToken: string;
    telegramChannelId: string;
};
```

### Getting API Authentication Information

1. Create Telegram Bot
* Search for `@BotFather` in Telegram
* Send `/newbot` command
* Follow prompts to set bot name and username
* Get Bot Token (format: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ)

2. Get Channel ID
* Create a Telegram channel
* Add your bot as channel administrator
* Channel ID has two formats:
    * Public channel: @channelname
    * Private channel: Numeric ID (e.g., -1001234567890)

### Method to Get Numeric ID

* Use bot to send message to channel, then call getUpdates API
* Or use online tools like @userinfobot to forward channel messages to get ID

> Send at least one message in the channel. Then execute in console: `curl https://api.telegram.org/bot${your-bot-token}/getUpdates` where id is the channel id.

### Running

After obtaining all keys, input the content to send and upload files to send, then click the run button on the `telegram-post` node.

## ⚙️ Content Optimization Rules

### Twitter
- **Optimization Strategy**: Remove extra line breaks, smart truncation when exceeding length
- **Media Support**: Only supports images and videos

### Telegram
- **Optimization Strategy**: 
  - Convert tags to bold format (`#tag` → `*#tag*`)
  - Convert links to Markdown format
  - Automatically send individually if media group sending fails
- **Media Support**: Supports images, videos, and documents

### LinkedIn *(In Development)*
- **Optimization Strategy**: Maintain professional format, optimize paragraph structure
- **Media Support**: Supports images, videos, and documents

## ⚠️ Important Notes

### Smart Skip Mechanism
- **Text Processing**: Automatically truncate when exceeding length limits, trying to keep remaining content complete
- **Media Processing**: Media files that don't meet channel requirements will automatically skip that channel, other compliant channels will publish normally
- **File Size**: Recommend not uploading overly large files, network issues may cause upload failures
