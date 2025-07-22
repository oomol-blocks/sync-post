import { OptimizationStats, SOCIAL_MEDIA_CONFIG } from "../constants";
import { cutChar } from "../helper";

export class TelegramOptimizer {
    static optimize(content: string): { optimized: string; stats: OptimizationStats; } {
        const originalLength = content.length;
        let optimized = content;

        // 将 #标签 转换为粗体
        optimized = optimized.replace(/#(\w+)/g, '*#$1*');

        optimized = optimized.replace(/https?:\/\/[^\s]+/g, (url) => {
            // 如果已经是 Markdown 格式就不转换
            if (optimized.includes(`](${url})`)) {
                return url;
            }
            return `[🔗 链接](${url})`;
        });

        // 确保段落间有适当间距
        optimized = optimized.replace(/\n{3,}/g, '\n\n');

        // 检查字符数限制
        const { TELEGRAM } = SOCIAL_MEDIA_CONFIG;
        const cutLimit = TELEGRAM.CHAR_LIMIT - TELEGRAM.CUT_BUFFER;
        optimized = cutChar(optimized, TELEGRAM.CHAR_LIMIT, cutLimit, TELEGRAM.CUT_POINTS, TELEGRAM.MIN_CUT_LENGTH);

        const finalLength = optimized.length;
        const withinLimit = finalLength <= TELEGRAM.CHAR_LIMIT;
        const truncated = finalLength < originalLength;

        const stats: OptimizationStats = {
            length: finalLength,
            withinLimit,
            truncated,
            originalLength,
            limit: TELEGRAM.CHAR_LIMIT
        };

        return {
            optimized,
            stats
        };
    }
}
