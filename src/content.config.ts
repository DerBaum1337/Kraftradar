import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const artikel = defineCollection({
	loader: glob({ base: './src/content/artikel', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		category: z.enum(['training', 'supplements', 'gym-zubehoer', 'mein-weg']),
		categoryLabel: z.string(),
		publishedAt: z.coerce.date(),
		updatedAt: z.coerce.date().optional(),
		author: z.string().default('Sebastian Trost'),
		estimatedReadingMinutes: z.number().int().positive().default(5),
		kind: z.enum(['artikel', 'supplement-test', 'zubehoer-test', 'mein-weg-update']),
		draft: z.boolean().default(false),
	}),
});

export const collections = { artikel };
