//#region generated meta
type Inputs = {
    mediaPaths: string[] | null;
    telegramContent: string;
    available: boolean;
    telegramBotToken: string;
    telegramChannelId: string;
};
type Outputs = {
    result: any;
};
//#endregion
import type { Context } from "@oomol/types/oocana";
import { TelegramService } from "~/utils/service/telegram";

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    try {
        if (params.available) {
            const telegramService = new TelegramService(params.telegramBotToken);
            const result = await telegramService.publishContent(
                params.telegramChannelId,
                params.telegramContent,
                params.mediaPaths
            );

            return { result }
        } else {
            context.reportLog("Telegram 格式检查未通过", "stderr");
        }
    } catch (error: any) {
        context.reportLog(`Telegram发布失败: ${error.message}`, "stderr");
        throw error;
    }
}
