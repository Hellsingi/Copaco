import { jest } from '@jest/globals';
import axios from 'axios';
import { QuoteService } from '../quote-service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('QuoteService', () => {
  let quoteService: QuoteService;

  beforeEach(() => {
    quoteService = new QuoteService();
    jest.clearAllMocks();
  });

  describe('fetchRandomQuote', () => {
    it('should fetch quote from quotable.io successfully', async () => {
      const mockQuotableResponse = {
        _id: 'test-id-123',
        content: 'Test quote content',
        author: 'Test Author',
        tags: ['wisdom', 'life'],
        length: 17,
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockQuotableResponse,
      });

      const result = await quoteService.fetchRandomQuote();

      expect(result).toEqual({
        id: 'test-id-123',
        content: 'Test quote content',
        author: 'Test Author',
        tags: ['wisdom', 'life'],
        likes: 0,
        source: 'quotable.io',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://api.quotable.io/random',
        { timeout: 5000 },
      );
    });

    it('should fallback to DummyJSON when quotable.io fails', async () => {
      const quotableError = new Error('Network error');
      const mockDummyResponse = {
        id: 42,
        quote: 'Fallback quote content',
        author: 'Fallback Author',
      };

      mockedAxios.get
        .mockRejectedValueOnce(quotableError)
        .mockResolvedValueOnce({ data: mockDummyResponse });

      const result = await quoteService.fetchRandomQuote();

      expect(result).toEqual({
        id: '42',
        content: 'Fallback quote content',
        author: 'Fallback Author',
        tags: [],
        likes: 0,
        source: 'dummyjson.com',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        1,
        'https://api.quotable.io/random',
        { timeout: 5000 },
      );
      expect(mockedAxios.get).toHaveBeenNthCalledWith(
        2,
        expect.stringContaining('https://dummyjson.com/quotes/'),
        { timeout: 5000 },
      );
    });

    it('should return fallback quote when both services fail', async () => {
      const quotableError = new Error('Quotable network error');
      const dummyError = new Error('DummyJSON network error');

      mockedAxios.get
        .mockRejectedValueOnce(quotableError)
        .mockRejectedValueOnce(dummyError);

      const result = await quoteService.fetchRandomQuote();

      expect(result).toEqual({
        id: 'fallback-1',
        content: 'The only way to do great work is to love what you do.',
        author: 'Steve Jobs',
        tags: ['motivation', 'work'],
        likes: 0,
        source: 'fallback',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });

      expect(mockedAxios.get).toHaveBeenCalledTimes(2);
    });

    it('should handle quotable.io response without optional fields', async () => {
      const mockQuotableResponse = {
        _id: 'test-id-456',
        content: 'Simple quote',
        author: 'Simple Author',
      };

      mockedAxios.get.mockResolvedValueOnce({
        data: mockQuotableResponse,
      });

      const result = await quoteService.fetchRandomQuote();

      expect(result).toEqual({
        id: 'test-id-456',
        content: 'Simple quote',
        author: 'Simple Author',
        tags: [],
        likes: 0,
        source: 'quotable.io',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    });
  });
});
