import axios from 'axios';
import { ExternalQuoteSchema, DummyJsonQuoteSchema } from './types';
import type { Quote } from './interfaces';

export class QuoteService {
  private readonly quotableUrl = 'https://api.quotable.io/random';
  private readonly dummyJsonUrl = 'https://dummyjson.com/quotes';

  private log(message: string): void {
    process.stdout.write(`[QuoteService] ${message}\n`);
  }

  async fetchRandomQuote(): Promise<Quote> {
    try {
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.log(`Quotable.io failed (${errorMessage}), trying DummyJSON...`);

      try {
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
        const fallbackErrorMessage = fallbackError instanceof Error ? fallbackError.message : 'Unknown error';
        this.log(`DummyJSON also failed (${fallbackErrorMessage}), using fallback quote`);

        return {
          id: 'fallback-1',
          content: 'The only way to do great work is to love what you do.',
          author: 'Steve Jobs',
          tags: ['motivation', 'work'],
          likes: 0,
          source: 'fallback',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
      }
    }
  }
}
