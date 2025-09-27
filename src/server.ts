import Fastify from 'fastify';
import { QuoteService } from './quote-service';
import { DatabaseService } from './database-service';

const fastify = Fastify({
  logger: true,
});

const quoteService = new QuoteService();
const dbService = new DatabaseService();

dbService.initialize().catch((err) => {
  console.error('Failed to initialize database:', err);
  process.exit(1);
});

fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Get random quote from external APIs (always fresh)
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

// Get smart recommended quote from database with weighted selection
fastify.get('/api/quote/recommended', async (request, reply) => {
  const query = request.query as { preferLiked?: string };
  const preferLiked = query.preferLiked === 'true';

  try {
    const quote = await dbService.getRandomQuoteWeighted(preferLiked);

    if (!quote) {
      // If no quotes in database, fetch from external API
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

// Get smart quote with additional context and stats
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
      // If no quotes in database, fetch from external API
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

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    // eslint-disable-next-line no-console
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
