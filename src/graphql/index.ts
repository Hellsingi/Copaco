import { FastifyInstance } from 'fastify';
import mercurius from 'mercurius';
import { QuoteService } from '../quote-service';
import { DatabaseService } from '../database-service';
import { schema } from './schema';
import { createResolvers } from './resolvers';

export const registerGraphQL = async (
  fastify: FastifyInstance,
  quoteService: QuoteService,
  dbService: DatabaseService,
): Promise<void> => {
  const resolvers = createResolvers(quoteService, dbService);

  await fastify.register(mercurius, {
    schema,
    resolvers,
    graphiql: true,
    path: '/graphql',
  });
};
