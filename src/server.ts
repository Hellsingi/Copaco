import Fastify from 'fastify';
import { QuoteService } from './quote-service';
import { DatabaseService } from './database-service';

const fastify = Fastify({
  logger: true,
});

const quoteService = new QuoteService();
const dbService = new DatabaseService();

// Simple health check route
fastify.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Random quote endpoint (now saves to DB)
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

// Like quote endpoint
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

// Start the server
const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('Server is running on http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
