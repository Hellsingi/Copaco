import fs from 'fs';
import path from 'path';
import { DatabaseService } from '../database-service';
import type { Quote } from '../interfaces';

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  const testDbPath = path.join(__dirname, 'test-quotes.db');

  beforeEach(async () => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    databaseService = new DatabaseService(testDbPath);
    await databaseService.initialize();
  });

  afterEach(() => {
    databaseService.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  describe('saveQuote', () => {
    it('should save a quote to the database', async () => {
      const mockQuote: Quote = {
        id: 'test-123',
        content: 'Test quote content',
        author: 'Test Author',
        tags: ['wisdom', 'test'],
        likes: 0,
        source: 'test',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      };

      await databaseService.saveQuote(mockQuote);

      const savedQuote = await databaseService.getQuote('test-123');
      expect(savedQuote).toEqual(mockQuote);
    });

    it('should replace existing quote with same ID', async () => {
      const originalQuote: Quote = {
        id: 'test-456',
        content: 'Original content',
        author: 'Original Author',
        tags: ['original'],
        likes: 0,
        source: 'test',
        createdAt: new Date('2023-01-01T00:00:00.000Z'),
        updatedAt: new Date('2023-01-01T00:00:00.000Z'),
      };

      const updatedQuote: Quote = {
        ...originalQuote,
        content: 'Updated content',
        likes: 5,
        updatedAt: new Date('2023-01-02T00:00:00.000Z'),
      };

      await databaseService.saveQuote(originalQuote);
      await databaseService.saveQuote(updatedQuote);

      const savedQuote = await databaseService.getQuote('test-456');
      expect(savedQuote).toEqual(updatedQuote);
    });
  });

  describe('getQuote', () => {
    it('should return null for non-existent quote', async () => {
      const result = await databaseService.getQuote('non-existent');

      expect(result).toBeNull();
    });

    it('should return quote with parsed tags', async () => {
      const mockQuote: Quote = {
        id: 'test-789',
        content: 'Quote with tags',
        author: 'Tag Author',
        tags: ['wisdom', 'life', 'philosophy'],
        likes: 0,
        source: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await databaseService.saveQuote(mockQuote);

      const result = await databaseService.getQuote('test-789');

      expect(result?.tags).toEqual(['wisdom', 'life', 'philosophy']);
    });
  });

  describe('likeQuote', () => {
    it('should increment likes for existing quote', async () => {
      const mockQuote: Quote = {
        id: 'test-like-1',
        content: 'Likeable quote',
        author: 'Popular Author',
        tags: [],
        likes: 0,
        source: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await databaseService.saveQuote(mockQuote);

      const newLikes = await databaseService.likeQuote('test-like-1');

      expect(newLikes).toBe(1);

      const updatedQuote = await databaseService.getQuote('test-like-1');
      expect(updatedQuote?.likes).toBe(1);
    });

    it('should throw error for non-existent quote', async () => {
      await expect(databaseService.likeQuote('non-existent')).rejects.toThrow(
        'Quote not found',
      );
    });

    it('should handle multiple likes correctly', async () => {
      const mockQuote: Quote = {
        id: 'test-multi-like',
        content: 'Very likeable quote',
        author: 'Super Popular Author',
        tags: [],
        likes: 0,
        source: 'test',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await databaseService.saveQuote(mockQuote);

      await databaseService.likeQuote('test-multi-like');
      await databaseService.likeQuote('test-multi-like');
      const finalLikes = await databaseService.likeQuote('test-multi-like');

      expect(finalLikes).toBe(3);
    });
  });

  describe('getMostLikedQuotes', () => {
    it('should return quotes ordered by likes descending', async () => {
      const quotes: Quote[] = [
        {
          id: 'quote-1',
          content: 'Least liked',
          author: 'Author 1',
          tags: [],
          likes: 1,
          source: 'test',
          createdAt: new Date('2023-01-01'),
          updatedAt: new Date('2023-01-01'),
        },
        {
          id: 'quote-2',
          content: 'Most liked',
          author: 'Author 2',
          tags: [],
          likes: 10,
          source: 'test',
          createdAt: new Date('2023-01-02'),
          updatedAt: new Date('2023-01-02'),
        },
        {
          id: 'quote-3',
          content: 'Medium liked',
          author: 'Author 3',
          tags: [],
          likes: 5,
          source: 'test',
          createdAt: new Date('2023-01-03'),
          updatedAt: new Date('2023-01-03'),
        },
      ];

      for (const quote of quotes) {
        await databaseService.saveQuote(quote);
      }

      const result = await databaseService.getMostLikedQuotes(3);

      expect(result).toHaveLength(3);
      expect(result[0]?.likes).toBe(10);
      expect(result[1]?.likes).toBe(5);
      expect(result[2]?.likes).toBe(1);
    });

    it('should respect limit parameter', async () => {
      for (let i = 1; i <= 5; i++) {
        const quote: Quote = {
          id: `quote-${i}`,
          content: `Quote ${i}`,
          author: `Author ${i}`,
          tags: [],
          likes: i,
          source: 'test',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        await databaseService.saveQuote(quote);
      }

      const result = await databaseService.getMostLikedQuotes(3);

      expect(result).toHaveLength(3);
    });

    it('should return empty array when no quotes exist', async () => {
      const result = await databaseService.getMostLikedQuotes();

      expect(result).toEqual([]);
    });
  });
});
