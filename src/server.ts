import Fastify from 'fastify';
import { QuoteService } from './quote-service';

const fastify = Fastify({
  logger: true
});

const quoteService = new QuoteService();

// Simple health check route
fastify.get('/health', async (request, reply) => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Random quote endpoint
fastify.get('/api/quote/random', async (request, reply) => {
  try {
    const quote = await quoteService.fetchRandomQuote();
    return quote;
  } catch (error) {
    return reply.status(500).send({
      error: 'Internal Server Error',
      message: 'Failed to fetch random quote',
      statusCode: 500
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