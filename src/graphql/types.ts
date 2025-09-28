export interface SmartQuoteArgs {
  preferLiked?: boolean;
}

export interface PopularQuotesArgs {
  limit?: number;
}

export interface LikeQuoteArgs {
  id: string;
}

export interface GraphQLContext {
  app: unknown;
}
