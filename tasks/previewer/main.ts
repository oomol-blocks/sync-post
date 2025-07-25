//#region generated meta
type Inputs = {
    content: string;
    mediaPaths: string[] | null;
};
type Outputs = {
    twitterContent: string;
    twitterAvailable: boolean;
    mediaPaths: string[] | null;
    telegramContent: string;
    telegramAvailable: boolean;
    linkedinContent: string;
    linkedinAvailable: boolean;
};
//#endregion
import type { Context } from "@oomol/types/oocana";
import { FileInfo, SOCIAL_MEDIA_CONFIG } from "~/utils/constants";
import { checkMediaFilesLimits, formatFileSize, getMediaTypeName, validateMediaPaths } from "~/utils/helper";
import { LinkedInOptimizer } from "~/utils/optimizer/linkedIn";
import { TelegramOptimizer } from "~/utils/optimizer/telegram";
import { TwitterOptimizer } from "~/utils/optimizer/twitter";

export default async function (
    params: Inputs,
    context: Context<Inputs, Outputs>
): Promise<Partial<Outputs> | undefined | void> {
    const contentResults = await optimizeContentForAllPlatforms(params, context);

    const mediaValidation = await validateMediaFiles(params.mediaPaths, context);

    const previewData = generatePreviewData(contentResults, mediaValidation);
    await context.preview({
        type: "markdown",
        data: previewData
    });

    return handleFinalOutput(contentResults, mediaValidation, context);
}

async function optimizeContentForAllPlatforms(params: Inputs, context: Context<Inputs, Outputs>) {
    const results = {
        twitter: TwitterOptimizer.optimize(params.content),
        linkedin: LinkedInOptimizer.optimize(params.content),
        telegram: TelegramOptimizer.optimize(params.content)
    };

    await context.reportProgress(60);
    return results;
}

async function validateMediaFiles(mediaPaths: string[] | null, context: Context<Inputs, Outputs>) {
    await context.reportProgress(75);

    const fileInfos = await validateMediaPaths(mediaPaths);
    const limitCheck = checkMediaFilesLimits(fileInfos);

    // 记录文件验证失败
    const invalidFiles = fileInfos.filter(f => !f.exists || f.type === 'unsupported');
    invalidFiles.forEach(file => {
        context.reportLog(`文件验证失败: ${file.path} - ${file.error}`, 'stderr');
    });

    await context.reportProgress(90);

    return {
        fileInfos,
        limitCheck,
        validFiles: fileInfos.filter(f => f.exists && f.type !== 'unsupported'),
        hasFileErrors: limitCheck.errors.length > 0,
        hasAnyPlatformSupport: limitCheck.twitter.supported || limitCheck.linkedin.supported || limitCheck.telegram.supported
    };
}

function handleFinalOutput(contentResults: any, mediaValidation: any, context: Context<Inputs, Outputs>) {
    const { validFiles, hasFileErrors, hasAnyPlatformSupport, limitCheck } = mediaValidation;

    // 检查错误，抛出
    if (hasFileErrors) {
        const errorMessage = `媒体文件验证失败:\n${limitCheck.errors.map((e: string) => `• ${e}`).join('\n')}`;
        context.reportLog(errorMessage, 'stderr');
        throw new Error(errorMessage);
    }

    const hasMediaButNoPlatformSupport = validFiles.length > 0 && !hasAnyPlatformSupport;
    if (hasMediaButNoPlatformSupport) {
        const platformErrors = [
            !limitCheck.twitter.supported && `Twitter: ${limitCheck.twitter.message}`,
            !limitCheck.linkedin.supported && `LinkedIn: ${limitCheck.linkedin.message}`,
            !limitCheck.telegram.supported && `Telegram: ${limitCheck.telegram.message}`
        ].filter(Boolean);

        const errorMessage = `媒体文件不符合任何平台要求:\n${platformErrors.map(e => `• ${e}`).join('\n')}`;
        context.reportLog(errorMessage, 'stderr');
        throw new Error(errorMessage);
    }

    // 记录警告
    if (limitCheck.warnings.length > 0) {
        limitCheck.warnings.forEach((warning: string) => {
            context.reportLog(`警告: ${warning}`, 'stderr');
        });
    }

    // 确定最终媒体路径
    const finalMediaPaths = (!hasFileErrors && !hasMediaButNoPlatformSupport && validFiles.length > 0)
        ? validFiles.map((f: FileInfo) => f.path)
        : null;

    const platformAvailability = determinePlatformAvailability(limitCheck, hasFileErrors, hasMediaButNoPlatformSupport);

    return {
        twitterContent: contentResults.twitter.optimized,
        linkedinContent: contentResults.linkedin.optimized,
        telegramContent: contentResults.telegram.optimized,
        mediaPaths: finalMediaPaths,
        twitterAvailable: platformAvailability.twitter,
        // TODO：开发中
        linkedinAvailable: false,
        // linkedinAvailable: platformAvailability.linkedin,
        telegramAvailable: platformAvailability.telegram
    };
}

function determinePlatformAvailability(limitCheck: any, hasFileErrors: boolean, hasMediaButNoPlatformSupport: boolean) {
    // 如果有文件错误/如果有媒体但没有平台支持，所有平台都不可用
    if (hasFileErrors || hasMediaButNoPlatformSupport) {
        return {
            twitter: false,
            linkedin: false,
            telegram: false
        };
    }

    // 否则，根据各平台的支持情况决定
    return {
        twitter: limitCheck.twitter.supported,
        linkedin: limitCheck.linkedin.supported,
        telegram: limitCheck.telegram.supported
    };
}

function generatePreviewData(contentResults: any, mediaValidation: any) {
    const { fileInfos, limitCheck, validFiles, hasFileErrors, hasAnyPlatformSupport } = mediaValidation;

    // 媒体文件信息
    const mediaInfo = fileInfos.length > 0
        ? fileInfos.map((fileInfo: FileInfo, index: number) => {
            const status = fileInfo.exists && fileInfo.type !== 'unsupported' ? '✅' : '❌';
            const typeLabel = getMediaTypeName(fileInfo.type);
            const sizeLabel = fileInfo.exists ? formatFileSize(fileInfo.size) : '无法读取';
            const errorInfo = fileInfo.error ? ` (${fileInfo.error})` : '';
            return `${index + 1}. ${status} **${typeLabel}** - ${fileInfo.name} (${sizeLabel})${errorInfo}`;
        }).join('\n')
        : '📎 无媒体文件';

    // 验证状态
    const validationStatus = getValidationStatus(hasFileErrors, hasAnyPlatformSupport, validFiles.length, limitCheck.warnings.length);

    return createPreviewMarkdown(contentResults, mediaInfo, validationStatus, limitCheck, hasFileErrors, hasAnyPlatformSupport, validFiles.length);
}

function getValidationStatus(hasFileErrors: boolean, hasAnyPlatformSupport: boolean, validFilesCount: number, warningsCount: number) {
    if (hasFileErrors) {
        return { icon: '❌', text: '文件验证失败' };
    }
    if (validFilesCount > 0 && !hasAnyPlatformSupport) {
        return { icon: '❌', text: '没有平台支持当前媒体配置' };
    }
    if (warningsCount > 0) {
        return { icon: '⚠️', text: '验证通过，但有平台限制' };
    }
    return { icon: '✅', text: '验证完全通过' };
}

function createPreviewMarkdown(contentResults: any, mediaInfo: string, validationStatus: any, limitCheck: any, hasFileErrors: boolean, hasAnyPlatformSupport: boolean, validFilesCount: number) {
    const getPlatformStatus = (supported: boolean, message: string) => {
        return supported ? '✅ 支持' : `❌ 不支持 - ${message}`;
    };

    const hasMediaButNoPlatformSupport = validFilesCount > 0 && !hasAnyPlatformSupport;

    return `### 📎 媒体文件信息
${mediaInfo}

${validationStatus.icon} 媒体信息验证状态: ${validationStatus.text}

### 📋 平台兼容性
- **🐦 Twitter:** ${getPlatformStatus(limitCheck.twitter.supported, limitCheck.twitter.message)}
- **💼 LinkedIn:** ${getPlatformStatus(limitCheck.linkedin.supported, limitCheck.linkedin.message)}
- **📢 Telegram:** ${getPlatformStatus(limitCheck.telegram.supported, limitCheck.telegram.message)}

${limitCheck.errors.length > 0 ? `
### ❌ 文件错误
${limitCheck.errors.map((e: string) => `- ${e}`).join('\n')}
**这些错误将阻止执行，请修复后重试。**
` : ''}

${limitCheck.warnings.length > 0 ? `
### ⚠️ 平台限制警告
${limitCheck.warnings.map((w: string) => `- ${w}`).join('\n')}
${!hasFileErrors && !hasMediaButNoPlatformSupport ? '*注意：部分平台可能无法使用所有媒体文件，但至少有一个平台支持。*' : ''}
` : ''}

${hasMediaButNoPlatformSupport ? `
### ❌ 平台兼容性错误
没有任何平台支持当前的媒体文件配置。请：
- 减少媒体文件数量  
- 更换支持的文件格式
- 检查文件大小限制
**此错误将阻止执行。**
` : ''}

---

## 🐦 Twitter
**字符统计:** ${contentResults.twitter.stats.length}/${SOCIAL_MEDIA_CONFIG.TWITTER.CHAR_LIMIT} 字符 ${contentResults.twitter.stats.withinLimit ? '✅' : '⚠️'}
${contentResults.twitter.stats.truncated ? '⚠️ *内容已截断*' : ''}
**媒体支持:** ${limitCheck.twitter.supported ? '✅ 完全支持' : '❌ 不支持'}

\`\`\`
${contentResults.twitter.optimized}
\`\`\`

---

## 💼 LinkedIn  
**字符统计:** ${contentResults.linkedin.stats.length}/${SOCIAL_MEDIA_CONFIG.LINKEDIN.CHAR_LIMIT} 字符 ${contentResults.linkedin.stats.withinLimit ? '✅' : '⚠️'}
${contentResults.linkedin.stats.truncated ? '⚠️ *内容已截断*' : ''}
**媒体支持:** ${limitCheck.linkedin.supported ? '✅ 完全支持' : '❌ 不支持'}

\`\`\`
${contentResults.linkedin.optimized}
\`\`\`

---

## 📢 Telegram
**字符统计:** ${contentResults.telegram.stats.length}/${SOCIAL_MEDIA_CONFIG.TELEGRAM.CHAR_LIMIT} 字符 ${contentResults.telegram.stats.withinLimit ? '✅' : '⚠️'}
${contentResults.telegram.stats.truncated ? '⚠️ *内容已截断*' : ''}
**媒体支持:** ${limitCheck.telegram.supported ? '✅ 完全支持' : '❌ 不支持'}

\`\`\`
${contentResults.telegram.optimized}
\`\`\`

${(hasFileErrors || hasMediaButNoPlatformSupport) ? `
---
## 🚫 执行已阻止
由于上述错误，系统将阻止继续执行。请修复错误后重新运行。
` : ''}`;
}
