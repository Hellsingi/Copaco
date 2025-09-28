import { QuoteService } from '../quote-service';
import { DatabaseService } from '../database-service';
import { SmartQuoteArgs, PopularQuotesArgs, LikeQuoteArgs } from './types';

export const createResolvers = (quoteService: QuoteService, dbService: DatabaseService) => ({
  Query: {
    randomQuote: async () => {
      const quote = await quoteService.fetchRandomQuote();
      await dbService.saveQuote(quote);
      return quote;
    },

    smartQuote: async (_: unknown, { preferLiked = false }: SmartQuoteArgs) => {
      const quote = await dbService.getRandomQuoteWeighted(preferLiked);
      if (!quote) {
        const newQuote = await quoteService.fetchRandomQuote();
        await dbService.saveQuote(newQuote);
        return newQuote;
      }
      return quote;
    },

    popularQuotes: async (_: unknown, { limit = 10 }: PopularQuotesArgs) => {
      return await dbService.getMostLikedQuotes(limit);
    },

    stats: async () => {
      const totalQuotes = await dbService.getQuoteCount();
      const likedQuotes = await dbService.getMostLikedQuotes(10);
      const averageLikes = likedQuotes.length > 0
        ? likedQuotes.reduce((sum, q) => sum + q.likes, 0) / likedQuotes.length
        : 0;

      return {
        totalQuotes,
        totalLikedQuotes: likedQuotes.length,
        averageLikes: Math.round(averageLikes * 100) / 100,
      };
    },
  },

  Mutation: {
    likeQuote: async (_: unknown, { id }: LikeQuoteArgs) => {
      try {
        const likes = await dbService.likeQuote(id);
        return { success: true, likes };
      } catch (error) {
        return { success: false, likes: 0 };
      }
    },
  },
});
