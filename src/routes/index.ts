import { FastifyInstance } from 'fastify';
import { QuoteService } from '../quote-service';
import { DatabaseService } from '../database-service';
import {
  RecommendedQuoteQuerySchema,
  SmartQuoteQuerySchema,
  SimilarQuotesRequestBodySchema,
  LikeQuoteParamsSchema,
} from '../types';

const getPopularityLevel = (likes: number, averageLikes: number): string => {
  if (likes > averageLikes) {
    return 'high';
  }
  if (likes > 0) {
    return 'medium';
  }
  return 'low';
};

export const registerRestRoutes = async (
  fastify: FastifyInstance,
  quoteService: QuoteService,
  dbService: DatabaseService,
): Promise<void> => {
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  fastify.get('/api/quote/random', async (request, reply) => {
    try {
      const quote = await quoteService.fetchRandomQuote();
      await dbService.saveQuote(quote);
      return quote;
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch random quote',
        statusCode: 500,
      });
    }
  });

  fastify.get('/api/quote/recommended', async (request, reply) => {
    try {
      const queryResult = RecommendedQuoteQuerySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: queryResult.error.issues,
          statusCode: 400,
        });
      }

      const { preferLiked } = queryResult.data;
      const quote = await dbService.getRandomQuoteWeighted(preferLiked);

      if (!quote) {
        const newQuote = await quoteService.fetchRandomQuote();
        await dbService.saveQuote(newQuote);
        return newQuote;
      }

      return quote;
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch recommended quote',
        statusCode: 500,
      });
    }
  });

  fastify.get('/api/quote/smart', async (request, reply) => {
    try {
      const queryResult = SmartQuoteQuerySchema.safeParse(request.query);
      if (!queryResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid query parameters',
          details: queryResult.error.issues,
          statusCode: 400,
        });
      }

      const { preferLiked, includeStats } = queryResult.data;
      const quote = await dbService.getRandomQuoteWeighted(preferLiked);

      if (!quote) {
        const newQuote = await quoteService.fetchRandomQuote();
        await dbService.saveQuote(newQuote);

        if (includeStats) {
          return {
            ...newQuote,
            isNew: true,
            totalQuotes: 1,
            averageLikes: 0,
          };
        }

        return newQuote;
      }

      if (includeStats) {
        const totalQuotes = await dbService.getQuoteCount();
        const likedQuotes = await dbService.getMostLikedQuotes(10);
        const averageLikes = likedQuotes.length > 0
          ? likedQuotes.reduce((sum, q) => sum + q.likes, 0) / likedQuotes.length
          : 0;

        return {
          ...quote,
          isNew: false,
          totalQuotes,
          averageLikes: Math.round(averageLikes * 100) / 100,
          popularity: getPopularityLevel(quote.likes, averageLikes),
        };
      }

      return quote;
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch smart quote',
        statusCode: 500,
      });
    }
  });

  fastify.post('/api/quote/:id/like', async (request, reply) => {
    try {
      const paramsResult = LikeQuoteParamsSchema.safeParse(request.params);
      if (!paramsResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid parameters',
          details: paramsResult.error.issues,
          statusCode: 400,
        });
      }

      const { id } = paramsResult.data;
      const likes = await dbService.likeQuote(id);
      return { id, likes };
    } catch (error) {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Quote not found',
        statusCode: 404,
      });
    }
  });

  fastify.get('/api/quotes/liked', async (request, reply) => {
    try {
      const quotes = await dbService.getMostLikedQuotes(10);
      return { quotes, total: quotes.length };
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to fetch liked quotes',
        statusCode: 500,
      });
    }
  });

  fastify.post('/api/quotes/similar', async (request, reply) => {
    try {
      const bodyResult = SimilarQuotesRequestBodySchema.safeParse(request.body);
      if (!bodyResult.success) {
        return reply.status(400).send({
          error: 'Bad Request',
          message: 'Invalid request body',
          details: bodyResult.error.issues,
          statusCode: 400,
        });
      }

      const { content, limit } = bodyResult.data;
      const similarQuotes = await quoteService.findSimilarQuotes(content, limit);
      return {
        quotes: similarQuotes,
        total: similarQuotes.length,
        searchText: content,
      };
    } catch (error) {
      return reply.status(500).send({
        error: 'Internal Server Error',
        message: 'Failed to find similar quotes',
        statusCode: 500,
      });
    }
  });
};
