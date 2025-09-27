import { z } from 'zod';

// External API response schemas
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

// Internal quote schema
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

// API request/response schemas
export const LikeQuoteRequestSchema = z.object({
  quoteId: z.string(),
});

export const SimilarQuotesRequestSchema = z.object({
  content: z.string(),
  limit: z.number().min(1).max(10).default(5),
});

export const RandomQuoteQuerySchema = z.object({
  preferLiked: z.string().transform((val: string) => val === 'true').default('false'),
});

// Types
export type ExternalQuote = z.infer<typeof ExternalQuoteSchema>;
export type DummyJsonQuote = z.infer<typeof DummyJsonQuoteSchema>;
export type Quote = z.infer<typeof QuoteSchema>;
export type LikeQuoteRequest = z.infer<typeof LikeQuoteRequestSchema>;
export type SimilarQuotesRequest = z.infer<typeof SimilarQuotesRequestSchema>;
export type RandomQuoteQuery = z.infer<typeof RandomQuoteQuerySchema>;

// Error schemas
export const ErrorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;