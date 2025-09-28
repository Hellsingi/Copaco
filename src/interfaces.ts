export interface ExternalQuoteResponse {
  _id: string;
  content: string;
  author: string;
  tags?: string[];
  length?: number;
}

export interface DummyJsonQuoteResponse {
  id: number;
  quote: string;
  author: string;
}

export interface Quote {
  id: string;
  content: string;
  author: string;
  tags: string[];
  likes: number;
  source: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface QuoteRow {
  id: string;
  content: string;
  author: string;
  tags: string;
  likes: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export interface LikesRow {
  likes: number;
}

export interface LikeQuoteRequest {
  quoteId: string;
}

export interface LikeQuoteResponse {
  id: string;
  likes: number;
}

export interface SimilarQuotesRequest {
  content: string;
  limit?: number;
}

export interface QuoteWithSimilarity extends Quote {
  similarity: number;
}

export interface RandomQuoteQuery {
  preferLiked?: boolean;
}

export interface QuotesListResponse {
  quotes: Quote[];
  total: number;
}

export interface ErrorResponse {
  error: string;
  message: string;
  statusCode: number;
}

export interface DatabaseConfig {
  dbPath?: string;
}

export interface QuoteServiceConfig {
  quotableUrl?: string;
  dummyJsonUrl?: string;
  timeout?: number;
}
