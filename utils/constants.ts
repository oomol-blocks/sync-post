export  const SOCIAL_MEDIA_CONFIG = {
    TWITTER: {
        CHAR_LIMIT: 280,
        MEDIA_LIMIT: 4,
        CUT_BUFFER: 10, // 截断时的缓冲字符
        CUT_POINTS: ['. ', '.\n', '\n\n', '\n'] as string[],
        MIN_CUT_LENGTH: 200
    },
    TELEGRAM: {
        CHAR_LIMIT: 4096,
        MEDIA_LIMIT: 10,
        CUT_BUFFER: 16,
        CUT_POINTS: ['\n\n', '. ', '.\n', '\n', '。', '！', '？'] as string[],
        MIN_CUT_LENGTH: 3500
    },
    LINKEDIN: {
        CHAR_LIMIT: 3000,
        MEDIA_LIMIT: 9,
        CUT_BUFFER: 20,
        CUT_POINTS: ['\n\n', '. ', '.\n', '\n'] as string[],
        MIN_CUT_LENGTH: 2500
    }
} as const;

export interface OptimizationStats {
    length: number;           // 当前字符长度
    withinLimit: boolean;     // 是否在限制内
    truncated: boolean;       // 是否被截断
    originalLength: number;   // 原始长度
    limit: number;           // 字符限制
}
