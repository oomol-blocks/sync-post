import { OptimizationStats, SOCIAL_MEDIA_CONFIG } from "../constants";
import { cutChar } from "../helper";

export class TwitterOptimizer {
    static optimize(content: string): { optimized: string; stats: OptimizationStats } {
        const config = SOCIAL_MEDIA_CONFIG.TWITTER;
        const originalLength = content.length;
        
        // Twitter特定优化
        let optimized = content
            .replace(/\n{3,}/g, '\n\n'); // 移除多余换行符

        // 应用字符限制
        optimized = cutChar(
            optimized, 
            config.CHAR_LIMIT, 
            config.CHAR_LIMIT - config.CUT_BUFFER, 
            config.CUT_POINTS, 
            config.MIN_CUT_LENGTH
        );

        return {
            optimized,
            stats: this.createStats(originalLength, optimized.length, config.CHAR_LIMIT)
        };
    }

    private static createStats(originalLength: number, finalLength: number, limit: number): OptimizationStats {
        return {
            length: finalLength,
            withinLimit: finalLength <= limit,
            truncated: finalLength < originalLength,
            originalLength,
            limit
        };
    }
}
