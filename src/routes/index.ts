import { FastifyInstance } from 'fastify';
import { QuoteService } from '../quote-service';
import { DatabaseService } from '../database-service';

export const registerRestRoutes = async (
  fastify: FastifyInstance,
  quoteService: QuoteService,
  dbService: DatabaseService,
): Promise<void> => {
  // Health check endpoint
  fastify.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Get random quote
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

  // Get recommended quote
  fastify.get('/api/quote/recommended', async (request, reply) => {
    const query = request.query as { preferLiked?: string };
    const preferLiked = query.preferLiked === 'true';

    try {
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

  // Get smart quote with optional stats
  fastify.get('/api/quote/smart', async (request, reply) => {
    const query = request.query as {
      preferLiked?: string;
      includeStats?: string;
      category?: string;
    };

    const preferLiked = query.preferLiked === 'true';
    const includeStats = query.includeStats === 'true';

    try {
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
          popularity: quote.likes > averageLikes ? 'high' : quote.likes > 0 ? 'medium' : 'low',
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

  // Like a quote
  fastify.post('/api/quote/:id/like', async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
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

  // Get liked quotes
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

  // Find similar quotes
  fastify.post('/api/quotes/similar', async (request, reply) => {
    const { content, limit = 5 } = request.body as { content: string; limit?: number };

    if (!content || typeof content !== 'string') {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Content is required and must be a string',
        statusCode: 400,
      });
    }

    if (limit && (typeof limit !== 'number' || limit < 1 || limit > 20)) {
      return reply.status(400).send({
        error: 'Bad Request',
        message: 'Limit must be a number between 1 and 20',
        statusCode: 400,
      });
    }

    try {
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
