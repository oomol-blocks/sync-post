type Inputs = {
    // 平台特定内容（必填）
    twitterContent: string;
    linkedinContent: string;
    telegramContent: string;
    // Twitter 配置
    twitterApiKey: string;
    twitterApiSecret: string;
    twitterAccessToken: string;
    twitterAccessTokenSecret: string;
    // LinkedIn 配置
    linkedinAccessToken: string;
    linkedinPersonId: string; // LinkedIn person URN
    // Telegram 配置
    telegramBotToken: string;
    telegramChannelId: string; // 频道ID，格式如 @channelname 或 -1001234567890
    // 可选的媒体文件
    medias?: string[] | null;
    // 发布平台选择
    publishToTwitter?: boolean;
    publishToLinkedIn?: boolean;
    publishToTelegram?: boolean;
};
type Outputs = {
    output: {
        success: boolean;
        results: {
            twitter?: any;
            linkedin?: any;
            telegram?: any;
        };
        errors?: string[];
    };
};
import type { Context } from "@oomol/types/oocana";
// import { LinkedInService } from "~/utils/service/linkedIn";
// import { TelegramService } from "~/utils/service/telegram";
import { TwitterService } from "~/utils/service/twitter";

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {

    const results: any = {};
    const errors: string[] = [];
    let completedTasks = 0;
    const totalTasks = [
        params.publishToTwitter ?? true,
        params.publishToLinkedIn ?? true,
        params.publishToTelegram ?? true
    ].filter(Boolean).length;

    const updateProgress = () => {
        const progress = (completedTasks / totalTasks) * 100;
        context.reportProgress(Math.round(progress));
    };

    // Twitter 发布
    if (params.publishToTwitter !== false) {
        try {
            await context.reportProgress(10);

            const twitterService = new TwitterService(
                params.twitterApiKey,
                params.twitterApiSecret,
                params.twitterAccessToken,
                params.twitterAccessTokenSecret
            );

            let mediaIds: string[] = [];
            if (params.medias && params.medias.length > 0) {
                mediaIds = await twitterService.uploadMedia(params.medias);
            }

            const result = await twitterService.publishTweet(params.twitterContent, mediaIds);
            results.twitter = result;

            completedTasks++;
            updateProgress();
        } catch (error: any) {
            errors.push(`Twitter发布失败: ${error.message}`);
            completedTasks++;
            updateProgress();
            console.log('error: ', error)
        }
    }

    await context.reportProgress(100);
    return {
        output: {
            success: errors.length === 0,
            results: results,
            errors: errors.length > 0 ? errors : undefined
        }
    };
}
