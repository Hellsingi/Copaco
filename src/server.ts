import Fastify from 'fastify';
import { QuoteService } from './quote-service';
import { DatabaseService } from './database-service';
import { registerGraphQL } from './graphql';
import { registerRestRoutes } from './routes';

const fastify = Fastify({
  logger: true,
});

const quoteService = new QuoteService();
const dbService = new DatabaseService();

const initializeServer = async (): Promise<void> => {
  try {
    // Initialize database
    await dbService.initialize();

    // Register GraphQL API
    await registerGraphQL(fastify, quoteService, dbService);

    // Register REST API routes
    await registerRestRoutes(fastify, quoteService, dbService);

    fastify.log.info('Server initialized successfully');
  } catch (err) {
    fastify.log.error({ err }, 'Failed to initialize server');
    process.exit(1);
  }
};

const start = async (): Promise<void> => {
  try {
    // Initialize server with all modules
    await initializeServer();

    // Start listening
    const port = process.env.PORT ? parseInt(process.env.PORT) : 3001;
    await fastify.listen({ port, host: '0.0.0.0' });

    fastify.log.info(`🚀 Server is running on http://localhost:${port}`);
    fastify.log.info(`📊 REST API available at http://localhost:${port}/api/*`);
    fastify.log.info(`🎯 GraphQL API available at http://localhost:${port}/graphql`);
    fastify.log.info(`🔍 GraphiQL interface available at http://localhost:${port}/graphiql`);
  } catch (err) {
    fastify.log.error({ err }, 'Failed to start server');
    process.exit(1);
  }
};

start();
