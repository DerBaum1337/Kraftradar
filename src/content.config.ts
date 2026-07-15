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
		author: z.string().default('Basti'),
		estimatedReadingMinutes: z.number().int().positive().default(5),
		kind: z.enum(['artikel', 'supplement-test', 'zubehoer-test', 'mein-weg-update']),
		image: z.string().optional(),
		imageAlt: z.string().optional(),
		ogImage: z.string().optional(),
		transparency: z.object({
			acquisition: z.string(),
			testPeriod: z.string(),
			priceDate: z.string(),
			affiliate: z.boolean().default(false),
			cooperation: z.boolean().default(false),
		}).optional(),
		productData: z.array(z.object({ label: z.string(), value: z.string() })).optional(),
		pros: z.array(z.string()).optional(),
		cons: z.array(z.string()).optional(),
		ratings: z.array(z.object({
			label: z.string(),
			score: z.number().min(0).max(10),
			weight: z.number().positive().max(100),
		})).optional(),
		overallScore: z.number().min(0).max(10).optional(),
		draft: z.boolean().default(false),
	}),
});

export const collections = { artikel };
