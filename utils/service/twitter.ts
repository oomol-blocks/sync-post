import { TwitterApi } from 'twitter-api-v2';

export class TwitterService {
    private client: TwitterApi;

    constructor(apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string) {
        this.client = new TwitterApi({
            appKey: apiKey,
            appSecret: apiSecret,
            accessToken: accessToken,
            accessSecret: accessTokenSecret,
        });
    }

    async uploadMedia(mediaPaths: string[]): Promise<string[]> {
        const mediaIds: string[] = [];
        for (const filePath of mediaPaths) {
            try {
                const mediaId = await this.client.v1.uploadMedia(filePath);
                mediaIds.push(mediaId);
            } catch (error: any) {
                throw new Error(`Twitter media upload failed for ${filePath}: ${error.message}`);
            }
        }
        return mediaIds;
    }

    async publishTweet(content: string, mediaIds?: string[]): Promise<any> {
        const result = await this.client.v2.tweet({
            text: content,
            media: mediaIds && mediaIds.length > 0 ? {
                media_ids: mediaIds as [string, string, string, string]
            } : undefined
        });
        return result.data;
    }
}
