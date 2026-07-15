import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

export const articleCategories = ['training', 'supplements', 'gym-zubehoer', 'mein-weg'] as const;
export const articleTypes = [
	'guide',
	'experience',
	'progress',
	'product-test',
	'comparison',
	'fundamentals',
	'update',
] as const;
export const articleStatuses = ['draft', 'review', 'ready', 'published'] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Bitte YYYY-MM-DD verwenden.');
const slug = z
	.string()
	.min(1)
	.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug nur in Kleinbuchstaben mit Bindestrichen.');

const imageSchema = z.object({
	src: z.string().startsWith('/'),
	alt: z.string(),
	caption: z.string().default(''),
	credit: z.string().default(''),
	creditUrl: z.url().optional().or(z.literal('')),
});

const sourceSchema = z.object({
	title: z.string().min(1),
	url: z.url(),
	publisher: z.string().default(''),
	accessedAt: isoDate.optional(),
});

const transparencySchema = z.object({
	personalExperience: z.boolean().default(false),
	selfPurchased: z.boolean().nullable().default(null),
	sponsored: z.boolean().default(false),
	affiliateLinks: z.boolean().default(false),
	note: z.string().default(''),
});

const productSchema = z.object({
	name: z.string().default(''),
	brand: z.string().default(''),
	model: z.string().default(''),
	variant: z.string().default(''),
	manufacturerUrl: z.url().optional().or(z.literal('')),
	purchaseDate: isoDate.optional().or(z.literal('')),
	purchasePrice: z.number().nonnegative().nullable().default(null),
	currentReferencePrice: z.number().nonnegative().nullable().default(null),
	priceCheckedAt: isoDate.optional().or(z.literal('')),
	currency: z.literal('EUR').default('EUR'),
	selfPurchased: z.boolean().default(true),
	providedFree: z.boolean().default(false),
	sponsored: z.boolean().default(false),
	affiliateLinks: z.boolean().default(false),
	testStartedAt: isoDate.optional().or(z.literal('')),
	testEndedAt: isoDate.optional().or(z.literal('')),
	usageCount: z.number().int().nonnegative().nullable().default(null),
	testStatus: z.enum(['planned', 'ongoing', 'completed']).default('ongoing'),
});

const ratingSchema = z.object({
	enabled: z.boolean().default(false),
	total: z.number().min(0).max(10).nullable().default(null),
	maximum: z.literal(10).default(10),
	criteria: z.array(z.object({
		name: z.string().min(1),
		score: z.number().min(0).max(10).nullable().default(null),
		weight: z.number().positive().max(100).nullable().default(null),
		note: z.string().default(''),
	})).default([]),
});

const articles = defineCollection({
	loader: glob({ base: './src/content/articles', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string().min(1),
		slug,
		category: z.enum(articleCategories),
		categoryLabel: z.string().min(1),
		articleType: z.enum(articleTypes),
		status: z.enum(articleStatuses),
		description: z.string().min(1),
		excerpt: z.string().min(1),
		publishedAt: z.coerce.date().optional(),
		updatedAt: z.coerce.date().optional(),
		author: slug,
		featured: z.boolean().default(false),
		noindex: z.boolean().default(false),
		toc: z.boolean().default(true),
		heroImage: imageSchema.optional(),
		seo: z.object({
			title: z.string().min(1),
			description: z.string().min(1),
			canonical: z.url().optional().or(z.literal('')),
			ogImage: z.string().startsWith('/').optional().or(z.literal('')),
		}),
		relatedArticles: z.array(slug).default([]),
		sources: z.array(sourceSchema).default([]),
		transparency: transparencySchema.default({
			personalExperience: false,
			selfPurchased: null,
			sponsored: false,
			affiliateLinks: false,
			note: '',
		}),
		product: productSchema.optional(),
		rating: ratingSchema.optional(),
		pros: z.array(z.string()).default([]),
		cons: z.array(z.string()).default([]),
		bestFor: z.array(z.string()).default([]),
		lessSuitableFor: z.array(z.string()).default([]),
		shortConclusion: z.string().default(''),
		valueAssessment: z.string().default(''),
		interimConclusion: z.string().default(''),
		longTermUpdate: z.string().default(''),
	}),
});

const authors = defineCollection({
	loader: glob({ base: './src/content/authors', pattern: '**/*.md' }),
	schema: z.object({
		name: z.string().min(1),
		slug,
		role: z.string().min(1),
		bio: z.string().default(''),
		image: imageSchema.optional(),
		sameAs: z.array(z.url()).default([]),
		startedTrainingAt: isoDate.optional(),
	}),
});

const pages = defineCollection({
	loader: glob({ base: './src/content/pages', pattern: '**/*.md' }),
	schema: z.object({
		title: z.string().min(1),
		description: z.string().min(1),
		seoTitle: z.string().min(1),
		seoDescription: z.string().min(1),
		noindex: z.boolean().default(false),
	}),
});

export const collections = { articles, authors, pages };
