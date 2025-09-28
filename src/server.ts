import Fastify from 'fastify';
import { QuoteService } from './quote-service';
import { DatabaseService } from './database-service';
import { registerGraphQL } from './graphql';
import { registerRestRoutes } from './routes';

const restApp = Fastify({
  logger: { level: 'info' },
});

const graphqlApp = Fastify({
  logger: { level: 'info' },
});

const quoteService = new QuoteService();
const dbService = new DatabaseService();

const initializeServices = async (): Promise<void> => {
  try {
    await dbService.initialize();
    restApp.log.info('✅ Database initialized successfully');
  } catch (err) {
    restApp.log.error({ err }, '❌ Failed to initialize database');
    process.exit(1);
  }
};

const startRestServer = async (): Promise<void> => {
  try {
    await registerRestRoutes(restApp, quoteService, dbService);

    const restPort = process.env.REST_PORT ? parseInt(process.env.REST_PORT) : 3000;
    await restApp.listen({ port: restPort, host: '0.0.0.0' });

    restApp.log.info(`🌐 REST API Server running on http://localhost:${restPort}`);
    restApp.log.info(`📊 REST Endpoints: http://localhost:${restPort}/api/*`);
    restApp.log.info(`❤️  Health Check: http://localhost:${restPort}/health`);
  } catch (err) {
    restApp.log.error({ err }, 'Failed to start REST server');
    process.exit(1);
  }
};

const startGraphQLServer = async (): Promise<void> => {
  try {
    await registerGraphQL(graphqlApp, quoteService, dbService);

    const graphqlPort = process.env.GRAPHQL_PORT ? parseInt(process.env.GRAPHQL_PORT) : 3001;
    await graphqlApp.listen({ port: graphqlPort, host: '0.0.0.0' });

    graphqlApp.log.info(`🎯 GraphQL Server running on http://localhost:${graphqlPort}`);
    graphqlApp.log.info(`� GraphQL Endpoint: http://localhost:${graphqlPort}/graphql`);
    graphqlApp.log.info(`� GraphiQL Interface: http://localhost:${graphqlPort}/graphiql`);
  } catch (err) {
    graphqlApp.log.error({ err }, 'Failed to start GraphQL server');
    process.exit(1);
  }
};

const start = async (): Promise<void> => {
  await initializeServices();

  await Promise.all([
    startRestServer(),
    startGraphQLServer(),
  ]);

  restApp.log.info('🎉 Both servers are running successfully!');
  restApp.log.info('📋 API Summary:');
  restApp.log.info('   REST API:    http://localhost:3000');
  restApp.log.info('   GraphQL API: http://localhost:3001');
  restApp.log.info('   GraphiQL UI: http://localhost:3001/graphiql');
};

process.on('SIGINT', async () => {
  restApp.log.info('🛑 Shutting down servers...');
  await Promise.all([
    restApp.close(),
    graphqlApp.close(),
  ]);
  restApp.log.info('✅ Servers closed gracefully');
  process.exit(0);
});

start();
