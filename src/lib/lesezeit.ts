const WORDS_PER_MINUTE = 200;

export function lesezeitInMinuten(content: string): number {
	const plainText = content
		.replace(/```[\s\S]*?```/g, '')
		.replace(/<[^>]+>/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, '')
		.replace(/\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/[#>*_`|]/g, ' ');
	const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
	return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
}
