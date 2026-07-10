import { IStockProvider, StockQuote, CompanyProfile, HistoricalDataPoint, SearchResult } from './stockProvider.interface';
import { TwelveDataProvider } from './twelveData.provider';
import { MockDataProvider } from './mockData.provider';

export class StockService {
  private provider: IStockProvider;
  private cache = new Map<string, { quote: StockQuote; expiresAt: number }>();
  private cacheDurationMs = 60 * 1000; // 1 minute cache

  constructor() {
    const key = process.env.TWELVE_DATA_API_KEY;
    if (key && key !== 'dummy_key' && key.trim() !== '') {
      this.provider = new TwelveDataProvider(key);
    } else {
      this.provider = new MockDataProvider();
    }
  }

  async getQuote(symbol: string): Promise<StockQuote> {
    const cleanSym = symbol.toUpperCase();
    const cached = this.cache.get(cleanSym);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.quote;
    }

    try {
      const quote = await this.provider.getQuote(cleanSym);
      this.cache.set(cleanSym, {
        quote,
        expiresAt: Date.now() + this.cacheDurationMs,
      });
      return quote;
    } catch (err) {
      if (!(this.provider instanceof MockDataProvider)) {
        const fallback = new MockDataProvider();
        return await fallback.getQuote(cleanSym);
      }
      throw err;
    }
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const cleanSym = symbol.toUpperCase();
    try {
      return await this.provider.getProfile(cleanSym);
    } catch (err) {
      if (!(this.provider instanceof MockDataProvider)) {
        const fallback = new MockDataProvider();
        return await fallback.getProfile(cleanSym);
      }
      throw err;
    }
  }

  async getHistory(symbol: string, interval: string = '1day', outputsize: number = 30): Promise<HistoricalDataPoint[]> {
    const cleanSym = symbol.toUpperCase();
    try {
      return await this.provider.getHistory(cleanSym, interval, outputsize);
    } catch (err) {
      if (!(this.provider instanceof MockDataProvider)) {
        const fallback = new MockDataProvider();
        return await fallback.getHistory(cleanSym, interval, outputsize);
      }
      throw err;
    }
  }

  async search(query: string): Promise<SearchResult[]> {
    try {
      return await this.provider.search(query);
    } catch (err) {
      if (!(this.provider instanceof MockDataProvider)) {
        const fallback = new MockDataProvider();
        return await fallback.search(query);
      }
      throw err;
    }
  }
}

export const stockService = new StockService();
export default stockService;
