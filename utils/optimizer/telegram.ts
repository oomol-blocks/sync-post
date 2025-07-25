import { OptimizationStats, SOCIAL_MEDIA_CONFIG } from "../constants";
import { cutChar } from "../helper";

export class TelegramOptimizer {
    static optimize(content: string): { optimized: string; stats: OptimizationStats } {
        const config = SOCIAL_MEDIA_CONFIG.TELEGRAM;
        const originalLength = content.length;
        
        // Telegram特定优化
        let optimized = content
            .replace(/#(\w+)/g, '*#$1*') // 标签转粗体
            .replace(/https?:\/\/[^\s]+/g, (url) => {
                // 链接转换为Markdown格式（如果尚未转换）
                return optimized.includes(`](${url})`) ? url : `[🔗 链接](${url})`;
            })
            .replace(/\n{3,}/g, '\n\n'); // 确保段落间适当间距

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
