import * as path from "node:path";
import * as fs from "node:fs/promises";
import { FileInfo, MediaType, MediaValidationResult, Platform, SOCIAL_MEDIA_CONFIG } from "./constants";

export async function makeApiRequest(url: string, options: RequestInit): Promise<any> {
    const response = await fetch(url, options);
    if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }
    return await response.json();
}

export async function uploadFile(url: string, file: any, headers: Record<string, string>): Promise<Response> {
    const response = await fetch(url, {
        method: 'POST',
        headers,
        body: file
    });
    if (!response.ok) {
        throw new Error(`File upload failed: ${response.status} ${response.statusText}`);
    }
    return response;
}

// 截取符合 charLimit 长度的字符串。尽可能保证截取的内容是完整的。
export const cutChar = (content: string, charLimit: number, cutLimit: number, points: string[], minCutLen: number) => {
    let _content = content
    if (_content.length > charLimit) {
        let bestCut = _content.substring(0, cutLimit);
        for (const cutPoint of points) {
            const lastIndex = _content.lastIndexOf(cutPoint, cutLimit);
            if (lastIndex > minCutLen) {
                bestCut = _content.substring(0, lastIndex + 1);
            }
        }

        _content = bestCut + '...';
        console.log(`内容已自动截断以符合 ${charLimit} 字符限制`);
    }

    return _content;
}

export async function validateMediaPaths(mediaPaths: string[] | null): Promise<FileInfo[]> {
    if (!mediaPaths || mediaPaths.length === 0) {
        return [];
    }

    const validationPromises = mediaPaths.map(path => validateFilePath(path));
    return await Promise.all(validationPromises);
}

// 主要函数：检查文件路径的媒体限制
export const checkMediaFilesLimits = (fileInfos: FileInfo[]) => {
    const result = {
        warnings: [] as string[],
        errors: [] as string[],
        twitter: { supported: true, message: '' },
        linkedin: { supported: true, message: '' },
        telegram: { supported: true, message: '' }
    };
    
    if (fileInfos.length === 0) {
        return result;
    }
    
    // 检查文件存在性和支持性
    const invalidFiles = fileInfos.filter(f => !f.exists || f.type === 'unsupported');
    if (invalidFiles.length > 0) {
        invalidFiles.forEach(file => {
            result.errors.push(`${file.name}: ${file.error || '不支持的文件类型'}`);
        });
    }
    
    // 只检查有效且支持的文件
    const validFiles = fileInfos.filter(f => f.exists && f.type !== 'unsupported');
    
    // 检查各平台的媒体数量限制
    if (validFiles.length > SOCIAL_MEDIA_CONFIG.TWITTER.MAX_MEDIA) {
        result.twitter.supported = false;
        result.twitter.message = `超过${SOCIAL_MEDIA_CONFIG.TWITTER.MAX_MEDIA}个文件限制`;
        result.warnings.push(`Twitter: 最多支持${SOCIAL_MEDIA_CONFIG.TWITTER.MAX_MEDIA}个媒体文件`);
    }
    
    if (validFiles.length > SOCIAL_MEDIA_CONFIG.LINKEDIN.MAX_MEDIA) {
        result.linkedin.supported = false;
        result.linkedin.message = `超过${SOCIAL_MEDIA_CONFIG.LINKEDIN.MAX_MEDIA}个文件限制`;
        result.warnings.push(`LinkedIn: 最多支持${SOCIAL_MEDIA_CONFIG.LINKEDIN.MAX_MEDIA}个媒体文件`);
    }
    
    if (validFiles.length > SOCIAL_MEDIA_CONFIG.TELEGRAM.MAX_MEDIA) {
        result.telegram.supported = false;
        result.telegram.message = `超过${SOCIAL_MEDIA_CONFIG.TELEGRAM.MAX_MEDIA}个文件限制`;
        result.warnings.push(`Telegram: 最多支持${SOCIAL_MEDIA_CONFIG.TELEGRAM.MAX_MEDIA}个媒体文件`);
    }
    
    // 检查每个有效文件在各平台的兼容性
    validFiles.forEach((fileInfo, index) => {
        const twitterCheck = checkFileForPlatform(fileInfo, Platform.TWITTER);
        const linkedinCheck = checkFileForPlatform(fileInfo, Platform.LINKEDIN);
        const telegramCheck = checkFileForPlatform(fileInfo, Platform.TELEGRAM);
        
        if (!twitterCheck.supported) {
            result.twitter.supported = false;
            if (!result.twitter.message) {
                result.twitter.message = `${fileInfo.name}: ${twitterCheck.message}`;
            }
        }
        
        if (!linkedinCheck.supported) {
            result.linkedin.supported = false;
            if (!result.linkedin.message) {
                result.linkedin.message = `${fileInfo.name}: ${linkedinCheck.message}`;
            }
        }
        
        if (!telegramCheck.supported) {
            result.telegram.supported = false;
            if (!result.telegram.message) {
                result.telegram.message = `${fileInfo.name}: ${telegramCheck.message}`;
            }
        }
    });
    
    return result;
}

const validateFilePath = async (filePath: string): Promise<FileInfo> => {
    const fileInfo: FileInfo = {
        exists: false,
        path: filePath,
        name: path.basename(filePath),
        size: 0,
        extension: '',
        mimeType: '',
        type: 'unsupported'
    };

    try {
        // 检查文件是否存在
        const stats = await fs.stat(filePath);
        
        if (!stats.isFile()) {
            fileInfo.error = '路径不是一个文件';
            return fileInfo;
        }

        fileInfo.exists = true;
        fileInfo.size = stats.size;
        fileInfo.extension = path.extname(filePath).slice(1); // 去掉点号
        
        // 检查是否是音频文件
        if (isAudioFile(fileInfo.extension)) {
            fileInfo.type = 'unsupported';
            fileInfo.error = '暂不支持音频文件上传';
            fileInfo.mimeType = 'audio/*';
            return fileInfo;
        }
        
        fileInfo.mimeType = getMimeTypeFromExtension(fileInfo.extension);
        fileInfo.type = getMediaTypeFromMime(fileInfo.mimeType);

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            fileInfo.error = '文件不存在';
        } else if (error.code === 'EACCES') {
            fileInfo.error = '没有文件访问权限';
        } else {
            fileInfo.error = `文件访问错误: ${error.message}`;
        }
    }
    return fileInfo;
}

export const getMediaTypeName = (type: MediaType | "unsupported") => {
    const typeNames = {
        [MediaType.IMAGE]: '图片',
        [MediaType.VIDEO]: '视频',
        [MediaType.DOCUMENT]: '文档',
        'unsupported': '不支持的格式'
    };
    return typeNames[type as keyof typeof typeNames] || '未知格式';
}

// 检查文件在指定平台的兼容性
const checkFileForPlatform = (fileInfo: FileInfo, platform: Platform) => {
    const config = SOCIAL_MEDIA_CONFIG[platform.toUpperCase()];
    const result = {
        supported: true,
        message: '',
        warnings: [] as string[]
    };
    
    if (!fileInfo.exists) {
        result.supported = false;
        result.message = fileInfo.error || '文件无法访问';
        return result;
    }
    
    // 检查是否是不支持的格式
    if (fileInfo.type === 'unsupported') {
        result.supported = false;
        result.message = fileInfo.error || '不支持的文件格式';
        return result;
    }
    
    const mediaType = fileInfo.type;
    
    // 检查文件大小限制
    if (mediaType === MediaType.IMAGE) {
        if (fileInfo.size > config.MAX_IMAGE_SIZE) {
            result.supported = false;
            result.message = `图片超过${formatFileSize(config.MAX_IMAGE_SIZE)}限制`;
        }
    } else if (mediaType === MediaType.VIDEO) {
        if (fileInfo.size > config.MAX_VIDEO_SIZE) {
            result.supported = false;
            result.message = `视频超过${formatFileSize(config.MAX_VIDEO_SIZE)}限制`;
        }
    } else if (mediaType === MediaType.DOCUMENT) {
        if (platform === Platform.TWITTER) {
            result.supported = false;
            result.message = 'Twitter不支持文档类型';
        } else if (platform === Platform.LINKEDIN && 'MAX_DOCUMENT_SIZE' in config) {
            if (fileInfo.size > config.MAX_DOCUMENT_SIZE) {
                result.supported = false;
                result.message = `文档超过${formatFileSize(config.MAX_DOCUMENT_SIZE)}限制`;
            }
        } else if (platform === Platform.TELEGRAM) {
            if (fileInfo.size > config.MAX_FILE_SIZE) {
                result.supported = false;
                result.message = `文件超过${formatFileSize(config.MAX_FILE_SIZE)}限制`;
            }
        }
    }
    
    // 检查格式支持
    if (result.supported) {
        let formatSupported = false;
        const ext = fileInfo.extension.toLowerCase();
        
        if (mediaType === MediaType.IMAGE && config.SUPPORTED_IMAGE_FORMATS.includes(ext)) {
            formatSupported = true;
        } else if (mediaType === MediaType.VIDEO && config.SUPPORTED_VIDEO_FORMATS.includes(ext)) {
            formatSupported = true;
        } else if (mediaType === MediaType.DOCUMENT && config.SUPPORTED_DOCUMENT_FORMATS.includes(ext)) {
            formatSupported = true;
        }
        
        if (!formatSupported) {
            result.supported = false;
            result.message = `不支持的${getMediaTypeName(mediaType)}格式: .${ext}`;
        }
    }
    
    return result;
}

export const formatFileSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
}

const getMimeTypeFromExtension = (ext: string): string => {
    const mimeTypes: Record<string, string> = {
        // 图片
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'webp': 'image/webp',
        'bmp': 'image/bmp',
        'svg': 'image/svg+xml',
        
        // 视频
        'mp4': 'video/mp4',
        'avi': 'video/avi',
        'mov': 'video/quicktime',
        'mkv': 'video/x-matroska',
        'webm': 'video/webm',
        'flv': 'video/x-flv',
        'wmv': 'video/x-ms-wmv',
        
        // 文档
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed'
    };
    
    return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
}

const getMediaTypeFromMime = (mimeType: string): MediaType | 'unsupported' => {
    if (mimeType.startsWith('image/')) return MediaType.IMAGE;
    if (mimeType.startsWith('video/')) return MediaType.VIDEO;
    if (mimeType.startsWith('text/') || mimeType.startsWith('application/')) return MediaType.DOCUMENT;
    
    // 音频文件现在被标记为不支持
    if (mimeType.startsWith('audio/')) return 'unsupported';
    
    return 'unsupported';
}

const isAudioFile = (ext: string): boolean => {
    const audioExts = ['mp3', 'wav', 'aac', 'm4a', 'ogg', 'flac', 'wma'];
    return audioExts.includes(ext.toLowerCase());
}
