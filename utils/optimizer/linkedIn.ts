import { OptimizationStats, SOCIAL_MEDIA_CONFIG } from "../constants";
import { cutChar } from "../helper";

export class LinkedInOptimizer {
    static optimize(content: string): { optimized: string; stats: OptimizationStats } {
        const originalLength = content.length;
        let optimized = content;

        // 确保段落间有适当间距
        optimized = optimized.replace(/\n{3,}/g, '\n\n');

        // 检查字符数限制
        const { LINKEDIN } = SOCIAL_MEDIA_CONFIG;
        const cutLimit = LINKEDIN.CHAR_LIMIT - LINKEDIN.CUT_BUFFER;
        optimized = cutChar(optimized, LINKEDIN.CHAR_LIMIT, cutLimit, LINKEDIN.CUT_POINTS, LINKEDIN.MIN_CUT_LENGTH)

        const finalLength = optimized.length;
        const withinLimit = finalLength <= LINKEDIN.CHAR_LIMIT;
        const truncated = finalLength < originalLength;

        const stats: OptimizationStats = {
            length: finalLength,
            withinLimit,
            truncated,
            originalLength,
            limit: LINKEDIN.CHAR_LIMIT
        };


        return {
            optimized,
            stats
        };
    }
}
