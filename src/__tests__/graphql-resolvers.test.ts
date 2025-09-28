import { createResolvers } from '../graphql/resolvers';
import { QuoteService } from '../quote-service';
import { DatabaseService } from '../database-service';

// Mock the services
jest.mock('../quote-service');
jest.mock('../database-service');

const MockedQuoteService = QuoteService as jest.MockedClass<typeof QuoteService>;
const MockedDatabaseService = DatabaseService as jest.MockedClass<typeof DatabaseService>;

describe('GraphQL Resolvers', () => {
  let quoteService: jest.Mocked<QuoteService>;
  let dbService: jest.Mocked<DatabaseService>;
  let resolvers: ReturnType<typeof createResolvers>;

  beforeEach(() => {
    quoteService = new MockedQuoteService() as jest.Mocked<QuoteService>;
    dbService = new MockedDatabaseService() as jest.Mocked<DatabaseService>;
    resolvers = createResolvers(quoteService, dbService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Query resolvers', () => {
    describe('randomQuote', () => {
      it('should fetch and save a random quote', async () => {
        const mockQuote = {
          id: '1',
          content: 'Test quote',
          author: 'Test Author',
          tags: ['test'],
          likes: 0,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        quoteService.fetchRandomQuote.mockResolvedValue(mockQuote);
        dbService.saveQuote.mockResolvedValue(undefined);

        const result = await resolvers.Query.randomQuote();

        expect(quoteService.fetchRandomQuote).toHaveBeenCalledTimes(1);
        expect(dbService.saveQuote).toHaveBeenCalledWith(mockQuote);
        expect(result).toEqual(mockQuote);
      });
    });

    describe('smartQuote', () => {
      it('should return weighted quote when available', async () => {
        const mockQuote = {
          id: '1',
          content: 'Test quote',
          author: 'Test Author',
          tags: ['test'],
          likes: 5,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbService.getRandomQuoteWeighted.mockResolvedValue(mockQuote);

        const result = await resolvers.Query.smartQuote({}, { preferLiked: true });

        expect(dbService.getRandomQuoteWeighted).toHaveBeenCalledWith(true);
        expect(result).toEqual(mockQuote);
      });

      it('should fetch new quote when no weighted quote available', async () => {
        const mockQuote = {
          id: '2',
          content: 'New quote',
          author: 'New Author',
          tags: ['new'],
          likes: 0,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        dbService.getRandomQuoteWeighted.mockResolvedValue(null);
        quoteService.fetchRandomQuote.mockResolvedValue(mockQuote);
        dbService.saveQuote.mockResolvedValue(undefined);

        const result = await resolvers.Query.smartQuote({}, { preferLiked: false });

        expect(dbService.getRandomQuoteWeighted).toHaveBeenCalledWith(false);
        expect(quoteService.fetchRandomQuote).toHaveBeenCalledTimes(1);
        expect(dbService.saveQuote).toHaveBeenCalledWith(mockQuote);
        expect(result).toEqual(mockQuote);
      });
    });

    describe('popularQuotes', () => {
      it('should return popular quotes with default limit', async () => {
        const mockQuotes = [
          {
            id: '1',
            content: 'Popular quote 1',
            author: 'Author 1',
            tags: ['popular'],
            likes: 10,
            source: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            content: 'Popular quote 2',
            author: 'Author 2',
            tags: ['popular'],
            likes: 8,
            source: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        dbService.getMostLikedQuotes.mockResolvedValue(mockQuotes);

        const result = await resolvers.Query.popularQuotes({}, {});

        expect(dbService.getMostLikedQuotes).toHaveBeenCalledWith(10);
        expect(result).toEqual(mockQuotes);
      });

      it('should return popular quotes with custom limit', async () => {
        const mockQuotes = [
          {
            id: '1',
            content: 'Popular quote 1',
            author: 'Author 1',
            tags: ['popular'],
            likes: 10,
            source: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        dbService.getMostLikedQuotes.mockResolvedValue(mockQuotes);

        const result = await resolvers.Query.popularQuotes({}, { limit: 5 });

        expect(dbService.getMostLikedQuotes).toHaveBeenCalledWith(5);
        expect(result).toEqual(mockQuotes);
      });
    });

    describe('stats', () => {
      it('should return statistics', async () => {
        const mockQuotes = [
          {
            id: '1',
            content: 'Quote 1',
            author: 'Author 1',
            tags: ['test'],
            likes: 10,
            source: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: '2',
            content: 'Quote 2',
            author: 'Author 2',
            tags: ['test'],
            likes: 6,
            source: 'test',
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ];
        dbService.getQuoteCount.mockResolvedValue(50);
        dbService.getMostLikedQuotes.mockResolvedValue(mockQuotes);

        const result = await resolvers.Query.stats();

        expect(dbService.getQuoteCount).toHaveBeenCalledTimes(1);
        expect(dbService.getMostLikedQuotes).toHaveBeenCalledWith(10);
        expect(result).toEqual({
          totalQuotes: 50,
          totalLikedQuotes: 2,
          averageLikes: 8,
        });
      });
    });
  });

  describe('Mutation resolvers', () => {
    describe('likeQuote', () => {
      it('should successfully like a quote', async () => {
        dbService.likeQuote.mockResolvedValue(5);

        const result = await resolvers.Mutation.likeQuote({}, { id: 'test-id' });

        expect(dbService.likeQuote).toHaveBeenCalledWith('test-id');
        expect(result).toEqual({ success: true, likes: 5 });
      });

      it('should handle errors when liking a quote', async () => {
        dbService.likeQuote.mockRejectedValue(new Error('Quote not found'));

        const result = await resolvers.Mutation.likeQuote({}, { id: 'invalid-id' });

        expect(dbService.likeQuote).toHaveBeenCalledWith('invalid-id');
        expect(result).toEqual({ success: false, likes: 0 });
      });
    });
  });
});
