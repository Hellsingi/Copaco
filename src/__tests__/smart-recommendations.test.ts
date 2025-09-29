import { DatabaseService } from '../database-service';
import { Quote } from '../interfaces';

describe('Smart Recommendations', () => {
  let dbService: DatabaseService;

  beforeEach(async () => {
    dbService = new DatabaseService(':memory:');
    await dbService.initialize();
  });

  afterEach(() => {
    if (dbService) {
      dbService.close();
    }
  });

  describe('getRandomQuoteWeighted', () => {
    it('should return null when no quotes exist', async () => {
      const quote = await dbService.getRandomQuoteWeighted();
      expect(quote).toBeNull();
    });

    it('should return a random quote when preferLiked is false', async () => {
      const testQuote: Quote = {
        id: '1',
        content: 'Test quote',
        author: 'Test Author',
        tags: ['test'],
        likes: 0,
        source: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbService.saveQuote(testQuote);
      const quote = await dbService.getRandomQuoteWeighted(false);

      expect(quote).not.toBeNull();
      expect(quote?.id).toBe('1');
      expect(quote?.content).toBe('Test quote');
    });
  });

  describe('getQuoteCount', () => {
    it('should return 0 when no quotes exist', async () => {
      const count = await dbService.getQuoteCount();
      expect(count).toBe(0);
    });

    it('should return correct count when quotes exist', async () => {
      const quotes: Quote[] = [
        {
          id: '1',
          content: 'Quote 1',
          author: 'Author 1',
          tags: ['test'],
          likes: 0,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          content: 'Quote 2',
          author: 'Author 2',
          tags: ['test'],
          likes: 5,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          content: 'Quote 3',
          author: 'Author 3',
          tags: ['wisdom'],
          likes: 2,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const quote of quotes) {
        await dbService.saveQuote(quote);
      }

      const count = await dbService.getQuoteCount();
      expect(count).toBe(3);
    });

    it('should update count after adding more quotes', async () => {
      const initialCount = await dbService.getQuoteCount();
      expect(initialCount).toBe(0);

      const quote: Quote = {
        id: '1',
        content: 'New quote',
        author: 'New Author',
        tags: ['new'],
        likes: 0,
        source: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dbService.saveQuote(quote);
      const updatedCount = await dbService.getQuoteCount();
      expect(updatedCount).toBe(1);
    });
  });

  describe('Smart recommendations integration', () => {
    it('should provide weighted recommendations based on popularity', async () => {
      const quotes: Quote[] = [
        {
          id: 'low-pop',
          content: 'Less popular quote',
          author: 'Author A',
          tags: ['motivation'],
          likes: 0,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'med-pop',
          content: 'Moderately popular quote',
          author: 'Author B',
          tags: ['wisdom'],
          likes: 0,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'high-pop',
          content: 'Very popular quote',
          author: 'Author C',
          tags: ['inspiration'],
          likes: 0,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      for (const quote of quotes) {
        await dbService.saveQuote(quote);
      }

      await dbService.likeQuote('med-pop');
      await dbService.likeQuote('med-pop');

      for (let i = 0; i < 8; i++) {
        await dbService.likeQuote('high-pop');
      }

      const mostLiked = await dbService.getMostLikedQuotes(3);
      expect(mostLiked).toHaveLength(3);
      expect(mostLiked[0]?.id).toBe('high-pop');
      expect(mostLiked[0]?.likes).toBe(8);
      expect(mostLiked[1]?.id).toBe('med-pop');
      expect(mostLiked[1]?.likes).toBe(2);
      expect(mostLiked[2]?.id).toBe('low-pop');
      expect(mostLiked[2]?.likes).toBe(0);

      const selections: string[] = [];
      for (let i = 0; i < 30; i++) {
        const quote = await dbService.getRandomQuoteWeighted(true);
        if (quote) {
          selections.push(quote.id);
        }
      }

      const highPopSelections = selections.filter(id => id === 'high-pop').length;
      const lowPopSelections = selections.filter(id => id === 'low-pop').length;

      expect(highPopSelections).toBeGreaterThan(lowPopSelections);
      expect(selections.length).toBe(30);
    });
  });
});
