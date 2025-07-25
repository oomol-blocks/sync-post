import * as fs from "fs";
import * as path from "path";

import { makeApiRequest, uploadFile } from "../helper";

export class LinkedInService {
    private readonly BASE_URL = "https://api.linkedin.com/v2";
    private accessToken: string;
    private personId: string;

    constructor(accessToken: string, personId: string) {
        this.accessToken = accessToken;
        this.personId = personId;
    }

    async uploadMedia(filePaths: string[]): Promise<any[]> {
        const mediaObjects = [];
        const errors = [];
        
        for (const [_, filePath] of filePaths.entries()) {
            try {
                const asset = await this.processMediaFile(filePath);
                mediaObjects.push({
                    status: 'READY',
                    description: { text: '' },
                    media: asset,
                    title: { text: '' }
                });
            } catch (error: any) {
                const fileName = path.basename(filePath);
                errors.push(`${fileName}: ${error.message}`);
                console.warn(`LinkedIn media upload failed for ${fileName}: ${error.message}`);
            }
        }
        
        if (errors.length > 0 && mediaObjects.length === 0) {
            throw new Error(`All media uploads failed: ${errors.join(', ')}`);
        }
        
        if (errors.length > 0) {
            console.warn(`Some media uploads failed: ${errors.join(', ')}`);
        }
        
        return mediaObjects;
    }

    async publishPost(content: string, mediaObjects?: any[]): Promise<any> {
        const linkedinPost: any = {
            author: `urn:li:person:${this.personId}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: { text: content },
                    shareMediaCategory: mediaObjects && mediaObjects.length > 0 ? "IMAGE" : "NONE"
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC"
            }
        };

        if (mediaObjects && mediaObjects.length > 0) {
            linkedinPost.specificContent['com.linkedin.ugc.ShareContent'].media = mediaObjects;
        }

        return await makeApiRequest(
            `${this.BASE_URL}/ugcPosts`,
            {
                method: 'POST',
                headers: {
                    ...this.getHeaders(),
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify(linkedinPost)
            }
        );
    }

    private getHeaders(): Record<string, string> {
        return {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
        };
    }

    private async registerMediaUpload(): Promise<{ uploadUrl: string; asset: string }> {
        const registerData = await makeApiRequest(
            `${this.BASE_URL}/assets?action=registerUpload`,
            {
                method: 'POST',
                headers: this.getHeaders(),
                body: JSON.stringify({
                    registerUploadRequest: {
                        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
                        owner: `urn:li:person:${this.personId}`,
                        serviceRelationships: [{
                            relationshipType: 'OWNER',
                            identifier: 'urn:li:userGeneratedContent'
                        }]
                    }
                })
            }
        );

        return {
            uploadUrl: registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl,
            asset: registerData.value.asset
        };
    }

    private async uploadMediaFile(uploadUrl: string, filePath: string): Promise<void> {
        const fileBuffer = fs.readFileSync(filePath);
        await uploadFile(uploadUrl, fileBuffer, {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/octet-stream'
        });
    }

    private async waitForMediaProcessing(asset: string, maxAttempts: number = 30): Promise<void> {
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const statusData = await makeApiRequest(
                `${this.BASE_URL}/assets/${asset.split(':').pop()}`,
                { headers: { 'Authorization': `Bearer ${this.accessToken}` } }
            );
            
            const status = statusData.recipes?.['urn:li:digitalmediaRecipe:feedshare-image']?.status;
            
            if (status === 'AVAILABLE') {
                return;
            } else if (status === 'FAILED') {
                throw new Error('LinkedIn media processing failed');
            }
            
            attempts++;
        }
        
        throw new Error('LinkedIn media processing timeout');
    }

    private async processMediaFile(filePath: string): Promise<string> {
        const { uploadUrl, asset } = await this.registerMediaUpload();
        await this.uploadMediaFile(uploadUrl, filePath);
        await this.waitForMediaProcessing(asset);
        
        return asset;
    }
}
