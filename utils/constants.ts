export const SOCIAL_MEDIA_CONFIG = {
    TWITTER: {
        CHAR_LIMIT: 280, // 文本长度限制
        CUT_BUFFER: 10, // 截断时的缓冲字符
        CUT_POINTS: ['\n\n', '. ', '.\n', '\n', '。', '！', '？'] as string[],
        MIN_CUT_LENGTH: 200,

        // 媒体限制——支持图片、视频、文件。基于 Twitter API v1.1
        MAX_MEDIA: 4, // 媒体个数
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
        MAX_VIDEO_SIZE: 512 * 1024 * 1024, // 512MB
        MAX_VIDEO_DURATION: 140, // 140秒（2分20秒）
        MAX_FILE_SIZE: 512 * 1024 * 1024, // 兼容性：通用文件大小限制
        SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
        SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov'],
        SUPPORTED_DOCUMENT_FORMATS: [] as string[], // Twitter 不支持文档

        // Twitter API v1.1 uploadMedia 支持 Base64, Buffer, File path。目前内部只支持 file
        SUPPORTED_INPUT_TYPES: ['url', 'base64', 'buffer', 'file'] as string[]
    },
    LINKEDIN: {
        CHAR_LIMIT: 3000,
        CUT_BUFFER: 20,
        CUT_POINTS: ['\n\n', '. ', '.\n', '\n', '。', '！', '？'] as string[],
        MIN_CUT_LENGTH: 2500,

        // 媒体限制——支持图片、视频、文档。基于LinkedIn API v2
        MAX_MEDIA: 9, // 媒体个数
        MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB（一般发布）
        MAX_VIDEO_SIZE: 5 * 1024 * 1024 * 1024, // 5GB（一般发布）
        MAX_FILE_SIZE: 5 * 1024 * 1024 * 1024, // 兼容性：通用文件大小限制
        MAX_VIDEO_DURATION: 15 * 60, // 15分钟（桌面）/ 10分钟（移动）
        MAX_DOCUMENT_SIZE: 100 * 1024 * 1024, // 100MB
        MAX_DOCUMENT_PAGES: 300,
        SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png'],
        SUPPORTED_VIDEO_FORMATS: ['mp4'],
        SUPPORTED_DOCUMENT_FORMATS: ['pdf', 'ppt', 'pptx', 'doc', 'docx'],
        // LinkedIn 需要先注册上传，然后上传文件
        UPLOAD_PROCESS: 'register_then_upload' as const
    },
    TELEGRAM: {
        CHAR_LIMIT: 4096,
        CAPTION_LIMIT: 1024, // 媒体组标题内容限制
        CUT_BUFFER: 16,
        CUT_POINTS: ['\n\n', '. ', '.\n', '\n', '。', '！', '？'] as string[],
        MIN_CUT_LENGTH: 3500,

        // 媒体限制——支持图片、视频、文件。基于标准 Bot API
        MAX_MEDIA: 10, // 媒体个数
        MAX_IMAGE_SIZE: 10 * 1024 * 1024, // 10MB（照片）
        MAX_VIDEO_SIZE: 50 * 1024 * 1024, // 50MB（标准 Bot API）
        MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB（标准 Bot API）
        MAX_FILE_SIZE_LOCAL_API: 2 * 1024 * 1024 * 1024, // 2GB（本地 Bot API 服务器）
        MAX_PHOTO_DIMENSION: 10000, // 照片最大宽度或高度
        SUPPORTED_IMAGE_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
        SUPPORTED_VIDEO_FORMATS: ['mp4', 'mov', 'mkv'],
        SUPPORTED_DOCUMENT_FORMATS: ['pdf', 'txt', 'doc', 'docx', 'zip'], // API 层面支持所有格式。这里只支持常用格式

        // Telegram 支持的发送方式
        SEND_METHODS: {
            SINGLE_PHOTO: 'sendPhoto',
            SINGLE_VIDEO: 'sendVideo', 
            SINGLE_DOCUMENT: 'sendDocument',
            MEDIA_GROUP: 'sendMediaGroup', // 作为媒体组发送。仅支持 photo 和 video
            MESSAGE_ONLY: 'sendMessage'
        } as const
    }
} as const;

export interface OptimizationStats {
    length: number;           // 当前字符长度
    withinLimit: boolean;     // 是否在限制内
    truncated: boolean;       // 是否被截断
    originalLength: number;   // 原始长度
    limit: number;           // 字符限制
}

// 媒体类型枚举
export enum MediaType {
    IMAGE = 'image',
    VIDEO = 'video',
    DOCUMENT = 'document'
}

// 平台枚举
export enum Platform {
    TWITTER = 'twitter',
    LINKEDIN = 'linkedin',
    TELEGRAM = 'telegram'
}

// 媒体验证结果接口
export interface MediaValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
    platform: Platform;
    mediaType: MediaType;
    fileSize: number;
    fileName: string;
}

// 媒体处理状态
export interface MediaProcessingResult {
    success: boolean;
    processedMedia?: any;
    error?: string;
    platform: Platform;
    originalFile: any;
}

// 文件信息接口 - 移除音频支持
export interface FileInfo {
    exists: boolean;
    path: string;
    name: string;
    size: number;
    extension: string;
    mimeType: string;
    type: MediaType | 'unsupported';
    error?: string;
}
