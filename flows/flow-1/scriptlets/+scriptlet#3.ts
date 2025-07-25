//#region generated meta
type Inputs = {
    linkedinContent: string;
    mediaPaths: string[] | null;
    available: boolean;
    linkedinAccessToken: string;
    linkedinPersonId: string;
};
type Outputs = {
    result: any;
};
//#endregion

import type { Context } from "@oomol/types/oocana";
import { LinkedInService } from "~/utils/service/linkedIn";

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    try {
        if (params.available) {
            const linkedinService = new LinkedInService(
                params.linkedinAccessToken,
                params.linkedinPersonId
            );

            let mediaObjects: any[] = [];
            if (params.mediaPaths && params.mediaPaths.length > 0) {
                mediaObjects = await linkedinService.uploadMedia(params.mediaPaths);
            }

            const result = await linkedinService.publishPost(params.linkedinContent, mediaObjects);
            return { result }
        } else {
            context.reportLog("LinkedIn 格式检查未通过", "stderr");
        }
    } catch (error: any) {
        context.reportLog(`LinkedIn发布失败: ${error.message}`, "stderr");
        throw error;
    }
}
