import axios from 'axios';
import { ExternalQuoteSchema, DummyJsonQuoteSchema } from './types';
import type { Quote } from './interfaces';

export class QuoteService {
  private readonly quotableUrl = 'https://api.quotable.io/random';
  private readonly dummyJsonUrl = 'https://dummyjson.com/quotes';

  async fetchRandomQuote(): Promise<Quote> {
    try {
      // Try quotable.io first
      const response = await axios.get(this.quotableUrl, {
        timeout: 5000,
      });

      const externalQuote = ExternalQuoteSchema.parse(response.data);

      return {
        id: externalQuote._id,
        content: externalQuote.content,
        author: externalQuote.author,
        tags: externalQuote.tags || [],
        likes: 0,
        source: 'quotable.io',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    } catch (error) {
      console.log('Quotable.io failed, trying DummyJSON...', error);

      try {
        // Fallback to DummyJSON
        const response = await axios.get(`${this.dummyJsonUrl}/${Math.floor(Math.random() * 100) + 1}`, {
          timeout: 5000,
        });

        const dummyQuote = DummyJsonQuoteSchema.parse(response.data);

        return {
          id: dummyQuote.id.toString(),
          content: dummyQuote.quote,
          author: dummyQuote.author,
          tags: [],
          likes: 0,
          source: 'dummyjson.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      } catch (fallbackError) {
        console.error('Both quote services failed:', fallbackError);
        throw new Error('Unable to fetch quote from external services');
      }
    }
  }
}
