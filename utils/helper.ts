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