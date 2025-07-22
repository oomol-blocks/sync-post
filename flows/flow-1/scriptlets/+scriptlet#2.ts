//#region generated meta
type Inputs = {
    content: string;
    enableTwitterOptimization: boolean | null;
    enableLinkedInOptimization: boolean | null;
    enableTelegramOptimization: boolean | null;
};
type Outputs = {
    twitterContent: string | null;
    linkedinContent: string | null;
    telegramContent: string | null;
};
//#endregion
import type { Context } from "@oomol/types/oocana";
import { SOCIAL_MEDIA_CONFIG } from "~/utils/constants";
import { LinkedInOptimizer } from "~/utils/optimizer/linkedIn";
import { TelegramOptimizer } from "~/utils/optimizer/telegram";
import { TwitterOptimizer } from "~/utils/optimizer/twitter";

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    // 优化各平台内容
    const twitterResult = params.enableTwitterOptimization !== false
        ? TwitterOptimizer.optimize(params.content)
        : { optimized: params.content, stats: { length: params.content.length, withinLimit: true, truncated: false } };

    await context.reportProgress(40);

    const linkedinResult = params.enableLinkedInOptimization !== false
        ? LinkedInOptimizer.optimize(params.content)
        : { optimized: params.content, stats: { length: params.content.length, withinLimit: true, truncated: false } };

    await context.reportProgress(60);

    const telegramResult = params.enableTelegramOptimization !== false
        ? TelegramOptimizer.optimize(params.content)
        : { optimized: params.content, stats: { length: params.content.length, withinLimit: true, truncated: false } };

    await context.reportProgress(80);

    // 创建预览内容
    const previewMarkdown = `# 📱 多平台内容预览

## 🐦 Twitter
**字符统计:** ${twitterResult.stats.length}/${SOCIAL_MEDIA_CONFIG.TWITTER.CHAR_LIMIT} 字符 ${twitterResult.stats.withinLimit ? '✅' : '⚠️'}
${twitterResult.stats.truncated ? '⚠️ *内容已截断*' : ''}

\`\`\`
${twitterResult.optimized}
\`\`\`

---

## 💼 LinkedIn
**字符统计:** ${linkedinResult.stats.length}/${SOCIAL_MEDIA_CONFIG.LINKEDIN.CHAR_LIMIT} 字符 ${linkedinResult.stats.withinLimit ? '✅' : '⚠️'}
${linkedinResult.stats.truncated ? '⚠️ *内容已截断*' : ''}

\`\`\`
${linkedinResult.optimized}
\`\`\`

---

## 📢 Telegram
**字符统计:** ${telegramResult.stats.length}/${SOCIAL_MEDIA_CONFIG.TELEGRAM.CHAR_LIMIT} 字符 ${telegramResult.stats.withinLimit ? '✅' : '⚠️'}
${telegramResult.stats.truncated ? '⚠️ *内容已截断*' : ''}

\`\`\`
${telegramResult.optimized}
\`\`\`
`;

    await context.preview({
        type: "markdown",
        data: previewMarkdown
    });

    await context.reportProgress(100);

    return {
        twitterContent: twitterResult.optimized,
        linkedinContent: linkedinResult.optimized,
        telegramContent: telegramResult.optimized
    };
}
