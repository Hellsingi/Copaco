import { z } from 'zod';

const stringToBooleanSchema = () =>
  z.string().optional().transform((val) => val ? val === 'true' : false);

const stringToBooleanWithDefaultSchema = (defaultValue: string) =>
  z.string().default(defaultValue).transform((val: string) => val === 'true');

export const ExternalQuoteSchema = z.object({
  _id: z.string(),
  content: z.string(),
  author: z.string(),
  tags: z.array(z.string()).optional(),
  length: z.number().optional(),
});

export const DummyJsonQuoteSchema = z.object({
  id: z.number(),
  quote: z.string(),
  author: z.string(),
});

export const QuoteSchema = z.object({
  id: z.string(),
  content: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  likes: z.number(),
  source: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const LikeQuoteRequestSchema = z.object({
  quoteId: z.string(),
});

export const SimilarQuotesRequestSchema = z.object({
  content: z.string(),
  limit: z.number().min(1).max(10).default(5),
});

export const RandomQuoteQuerySchema = z.object({
  preferLiked: stringToBooleanWithDefaultSchema('false'),
});

export const RecommendedQuoteQuerySchema = z.object({
  preferLiked: stringToBooleanSchema(),
});

export const SmartQuoteQuerySchema = z.object({
  preferLiked: stringToBooleanSchema(),
  includeStats: stringToBooleanSchema(),
  category: z.string().optional(),
});

export const SimilarQuotesRequestBodySchema = z.object({
  content: z.string().min(1, 'Content is required and cannot be empty'),
  limit: z.union([z.string(), z.number()]).optional()
    .transform((val) => val ? parseInt(String(val), 10) : 5)
    .refine((val) => !isNaN(val) && val >= 1 && val <= 20, {
      message: 'Limit must be a number between 1 and 20',
    }),
});

export const LikeQuoteParamsSchema = z.object({
  id: z.string().min(1, 'Quote ID is required'),
});
