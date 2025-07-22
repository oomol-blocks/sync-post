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

    async uploadMedia(medias: string[]): Promise<string[]> {
        if (medias.length > 4) {
            throw new Error("Twitter only supports up to 4 media files");
        }

        const mediaIds: string[] = [];
        for (const media of medias) {
            const mediaId = await this.client.v1.uploadMedia(media);
            mediaIds.push(mediaId);
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
