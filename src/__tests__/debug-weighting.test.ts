import { DatabaseService } from '../database-service';
import { Quote } from '../interfaces';

describe('Debug Weighting', () => {
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

  it('should debug weighting behavior', async () => {
    const quote1: Quote = {
      id: '1',
      content: 'Quote 1',
      author: 'Author 1',
      tags: [],
      likes: 0,
      source: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const quote2: Quote = {
      id: '2',
      content: 'Quote 2',
      author: 'Author 2',
      tags: [],
      likes: 0,
      source: 'test',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await dbService.saveQuote(quote1);
    await dbService.saveQuote(quote2);

    for (let i = 0; i < 15; i++) {
      await dbService.likeQuote('2');
    }

    const mostLiked = await dbService.getMostLikedQuotes(2);
    console.log('Quote likes:', mostLiked.map(q => ({ id: q.id, likes: q.likes })));

    console.log('\n--- Random selection (preferLiked=false) ---');
    const randomSelections: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const quote = await dbService.getRandomQuoteWeighted(false);
      if (quote) {
        randomSelections[quote.id] = (randomSelections[quote.id] || 0) + 1;
      }
    }
    console.log('Random selections:', randomSelections);

    console.log('\n--- Weighted selection (preferLiked=true) ---');
    const weightedSelections: Record<string, number> = {};
    for (let i = 0; i < 20; i++) {
      const quote = await dbService.getRandomQuoteWeighted(true);
      if (quote) {
        weightedSelections[quote.id] = (weightedSelections[quote.id] || 0) + 1;
      }
    }
    console.log('Weighted selections:', weightedSelections);

    expect(true).toBe(true);
  });
});
