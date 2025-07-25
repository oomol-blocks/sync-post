import * as fs from 'fs';
import * as path from 'path';

import { makeApiRequest } from "../helper";
import { MediaType, SOCIAL_MEDIA_CONFIG } from '../constants';

type SupportTelegramMedia = 'photo' | MediaType.VIDEO | MediaType.DOCUMENT;

export class TelegramService {
    private apiUrl: string;

    constructor(botToken: string) {
        this.apiUrl = `https://api.telegram.org/bot${botToken}`;
    }

    async publishContent(channelId: string, content: string, filePaths?: string[]): Promise<any> {
        if (filePaths && filePaths.length > 0) {
            const captionLimit = SOCIAL_MEDIA_CONFIG.TELEGRAM.CAPTION_LIMIT;
            const shouldSendSeparateMessage = content.length > captionLimit;

            // 分离媒体文件和文档文件
            const mediaPaths = filePaths.filter(filePath =>
                this.getMediaTypeFromPath(filePath) !== MediaType.DOCUMENT
            );
            const documentPaths = filePaths.filter(filePath =>
                this.getMediaTypeFromPath(filePath) === MediaType.DOCUMENT
            );

            const results = [];

            // 如果内容超过 caption 限制，先发送纯文本消息
            if (shouldSendSeparateMessage) {
                console.log(`内容长度 ${content.length} 超过 caption 限制 ${captionLimit}，先发送文本消息，然后发送不带 caption 的媒体`);
                results.push(await this.sendMessage(channelId, content));
            }

            // 处理媒体文件（图片和视频）
            if (mediaPaths.length > 0) {
                const mediaCaption = shouldSendSeparateMessage ? '' : content;

                if (mediaPaths.length === 1) {
                    results.push(await this.sendSingleMedia(channelId, mediaPaths[0], mediaCaption));
                } else {
                    // 尝试发送媒体组，如果失败则逐个发送
                    try {
                        results.push(await this.sendMediaGroup(channelId, mediaPaths, mediaCaption));
                    } catch (error) {
                        console.warn('Media group failed, sending individually:', error);

                        // 发送第一个媒体（可能带或不带标题）
                        results.push(await this.sendSingleMedia(channelId, mediaPaths[0], mediaCaption));

                        // 其余媒体不带标题
                        for (let i = 1; i < mediaPaths.length; i++) {
                            results.push(await this.sendSingleMedia(channelId, mediaPaths[i], ''));
                        }
                    }
                }
            }

            // 处理文档文件（逐个发送）
            for (const [index, documentPath] of documentPaths.entries()) {
                // 如果已经发送了文本消息或媒体，文档就不带 caption
                 const documentCaption = (results.length === 0 && index === 0 && !shouldSendSeparateMessage) ? content : '';
                results.push(await this.sendSingleMedia(channelId, documentPath, documentCaption));
            }

            // 如果没有任何媒体文件，只发送文本
            if (results.length === 0) {
                results.push(await this.sendMessage(channelId, content));
            }

            return results.length === 1 ? results[0] : results;
        } else {
            return await this.sendMessage(channelId, content);
        }
    }

    private getMediaTypeFromPath(filePath: string): SupportTelegramMedia {
        const ext = path.extname(filePath).toLowerCase().slice(1);

        // @ts-ignore
        if (SOCIAL_MEDIA_CONFIG.TELEGRAM.SUPPORTED_IMAGE_FORMATS.includes(ext)) return 'photo';
        // @ts-ignore
        if (SOCIAL_MEDIA_CONFIG.TELEGRAM.SUPPORTED_VIDEO_FORMATS.includes(ext)) return MediaType.VIDEO;
        return MediaType.DOCUMENT;
    }

    // 单张资源发送
    private async sendSingleMedia(channelId: string, filePath: string, caption: string): Promise<any> {
        const telegramMediaType = this.getMediaTypeFromPath(filePath);
        const formData = new FormData();

        formData.append('chat_id', channelId);
        formData.append('caption', caption);
        formData.append('parse_mode', 'Markdown');

        const fileBuffer = fs.readFileSync(filePath);
        const fileName = path.basename(filePath);
        const blob = new Blob([fileBuffer]);

        formData.append(telegramMediaType, blob, fileName);

        let endpoint = SOCIAL_MEDIA_CONFIG.TELEGRAM.SEND_METHODS.SINGLE_PHOTO.replace('send', '/send');
        if (telegramMediaType === MediaType.VIDEO) {
            endpoint = SOCIAL_MEDIA_CONFIG.TELEGRAM.SEND_METHODS.SINGLE_VIDEO.replace('send', '/send');
        } else if (telegramMediaType === MediaType.DOCUMENT) {
            endpoint = SOCIAL_MEDIA_CONFIG.TELEGRAM.SEND_METHODS.SINGLE_DOCUMENT.replace('send', '/send');
        }

        return await makeApiRequest(`${this.apiUrl}${endpoint}`, {
            method: 'POST',
            body: formData
        });
    }

    // 媒体组的形式发送。仅支持图片和视频的集合
    private async sendMediaGroup(channelId: string, filePaths: string[], caption: string): Promise<any> {
        const supportedPaths = filePaths.filter(filePath => {
            const type = this.getMediaTypeFromPath(filePath);
            return type === 'photo' || type === MediaType.VIDEO;
        });

        const mediaGroup = supportedPaths.map((filePath, index) => ({
            type: this.getMediaTypeFromPath(filePath),
            media: `attach://media${index}`,
            caption: index === 0 ? caption : undefined,
            parse_mode: index === 0 ? 'Markdown' : undefined
        }));

        const formData = new FormData();
        formData.append('chat_id', channelId);
        formData.append('media', JSON.stringify(mediaGroup));

        supportedPaths.forEach((filePath, index) => {
            const fileBuffer = fs.readFileSync(filePath);
            const fileName = path.basename(filePath);
            const blob = new Blob([fileBuffer]);
            formData.append(`media${index}`, blob, fileName);
        });

        return await makeApiRequest(`${this.apiUrl}/sendMediaGroup`, {
            method: 'POST',
            body: formData
        });
    }

    private async sendMessage(channelId: string, text: string): Promise<any> {
        return await makeApiRequest(`${this.apiUrl}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: channelId,
                text: text,
                parse_mode: 'Markdown',
                disable_web_page_preview: false
            })
        });
    }
}
