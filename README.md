# sync-post

## poster 配置说明

### 发布到推特

```ts
type Inputs = {
    twitterContent: string;     // 发布内容
    medias?: string[] | null;   // （可选）媒体文件
    publishToTwitter?: boolean; // 发布平台选择（如果发布到推特，需要设置为 true）
    twitterApiKey: string;
    twitterApiSecret: string;
    twitterAccessToken: string;
    twitterAccessTokenSecret: string;
};
```

#### 获取 API 认证信息

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
