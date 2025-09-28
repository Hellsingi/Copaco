import axios from 'axios';
import * as natural from 'natural';
import { ExternalQuoteSchema, DummyJsonQuoteSchema } from './types';
import type { Quote, QuoteWithSimilarity, ExternalQuoteResponse } from './interfaces';

export class QuoteService {
  private readonly quotableUrl = 'https://api.quotable.io/random';
  private readonly dummyJsonUrl = 'https://dummyjson.com/quotes';
  private readonly quotableSearchUrl = 'https://api.quotable.io/quotes';

  private log(message: string): void {
    process.stdout.write(`[QuoteService] ${message}\n`);
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Tokenize both texts and calculate similarity based on common words
    const tokens1 = this.tokenizeAndStem(text1);
    const tokens2 = this.tokenizeAndStem(text2);

    if (tokens1.length === 0 || tokens2.length === 0) {
      return 0;
    }

    // Calculate Jaccard similarity (intersection over union)
    const set1 = new Set(tokens1);
    const set2 = new Set(tokens2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    const jaccardSimilarity = intersection.size / union.size;

    // Also calculate basic string similarity using Levenshtein
    const maxLength = Math.max(text1.length, text2.length);
    const distance = natural.LevenshteinDistance(text1.toLowerCase(), text2.toLowerCase());
    const stringSimilarity = 1 - (distance / maxLength);

    // Combine both metrics (weighted average)
    return (jaccardSimilarity * 0.7) + (stringSimilarity * 0.3);
  }

  private tokenizeAndStem(text: string): string[] {
    // Tokenize and stem the text for better matching
    const tokenizer = new natural.WordTokenizer();
    const tokens = tokenizer.tokenize(text.toLowerCase()) || [];
    return tokens.map(token => natural.PorterStemmer.stem(token));
  }

  async findSimilarQuotes(inputQuote: string, limit: number = 5): Promise<Quote[]> {
    try {
      // Fetch multiple quotes to compare against
      const response = await axios.get(this.quotableSearchUrl, {
        timeout: 5000,
        params: {
          limit: 50, // Get more quotes to find the best matches
        },
      });

      const quotes: Quote[] = response.data.results.map((externalQuote: ExternalQuoteResponse) => ({
        id: externalQuote._id,
        content: externalQuote.content,
        author: externalQuote.author,
        tags: externalQuote.tags || [],
        likes: 0,
        source: 'quotable.io',
        createdAt: new Date(),
        updatedAt: new Date(),
      }));

      // Calculate similarity scores
      const quotesWithSimilarity: QuoteWithSimilarity[] = quotes.map((quote: Quote) => ({
        ...quote,
        similarity: this.calculateSimilarity(inputQuote, quote.content),
      }));

      // Sort by similarity (descending) and return top matches
      return quotesWithSimilarity
        .sort((a: QuoteWithSimilarity, b: QuoteWithSimilarity) => b.similarity - a.similarity)
        .slice(0, limit)
        .filter((quote: QuoteWithSimilarity) => quote.similarity > 0.2) // Only return quotes with reasonable similarity
        .map((quoteWithSim) => ({
          id: quoteWithSim.id,
          content: quoteWithSim.content,
          author: quoteWithSim.author,
          tags: quoteWithSim.tags,
          likes: quoteWithSim.likes,
          source: quoteWithSim.source,
          createdAt: quoteWithSim.createdAt,
          updatedAt: quoteWithSim.updatedAt,
        })); // Remove similarity from final result

    } catch (error) {
      this.log(`Failed to fetch similar quotes: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return [];
    }
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
