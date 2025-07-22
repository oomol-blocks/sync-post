import { OptimizationStats, SOCIAL_MEDIA_CONFIG } from "../constants";
import { cutChar } from "../helper";

export class TwitterOptimizer {
    static optimize(content: string): { optimized: string; stats: OptimizationStats } {
        const originalLength = content.length;
        let optimized = content;

        // 移除多余的换行符
        optimized = optimized.replace(/\n{3,}/g, '\n\n');

        // 检查字符数限制
        const { TWITTER } = SOCIAL_MEDIA_CONFIG;
        const cutLimit = TWITTER.CHAR_LIMIT - TWITTER.CUT_BUFFER;
        optimized = cutChar(optimized, TWITTER.CHAR_LIMIT, cutLimit, TWITTER.CUT_POINTS, TWITTER.MIN_CUT_LENGTH)

        // 计算统计信息
        const finalLength = optimized.length;
        const withinLimit = finalLength <= TWITTER.CHAR_LIMIT;
        const truncated = finalLength < originalLength;

        const stats: OptimizationStats = {
            length: finalLength,
            withinLimit,
            truncated,
            originalLength,
            limit: TWITTER.CHAR_LIMIT
        };

        return {
            optimized,
            stats
        };
    }
}
