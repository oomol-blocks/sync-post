//#region generated meta
type Inputs = {
    twitterContent: string;
    available: boolean;
    mediaPaths: string[] | null;
    twitterApiKey: string;
    twitterApiSecret: string;
    twitterAccessToken: string;
    twitterAccessTokenSecret: string;
};
type Outputs = {
    result: any;
};
//#endregion
import type { Context } from "@oomol/types/oocana";
import { TwitterService } from "~/utils/service/twitter";

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    try {
        if (params.available) {
            const twitterService = new TwitterService(
                params.twitterApiKey,
                params.twitterApiSecret,
                params.twitterAccessToken,
                params.twitterAccessTokenSecret
            );

            let mediaIds: string[] = [];
            if (params.mediaPaths && params.mediaPaths.length > 0) {
                mediaIds = await twitterService.uploadMedia(params.mediaPaths);
            }

            const result = await twitterService.publishTweet(params.twitterContent, mediaIds);

            return { result };
        } else {
            context.reportLog("Twitter 格式检查未通过", "stderr");
        }
    } catch (error: any) {
        context.reportLog(`Twitter发布失败: ${error.message}`, "stderr");
        throw error;
    }
}
