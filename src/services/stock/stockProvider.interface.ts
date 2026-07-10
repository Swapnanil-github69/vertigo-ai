export interface StockQuote {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  high: number;
  low: number;
  open: number;
  previousClose: number;
  volume: number;
  timestamp: Date;
}

export interface CompanyProfile {
  symbol: string;
  name: string;
  exchange: string;
  sector: string;
  industry: string;
  description: string;
  logo: string;
  weburl: string;
}

export interface HistoricalDataPoint {
  time: string; // YYYY-MM-DD format
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
}

export interface IStockProvider {
  getQuote(symbol: string): Promise<StockQuote>;
  getProfile(symbol: string): Promise<CompanyProfile>;
  getHistory(symbol: string, interval: string, outputsize: number): Promise<HistoricalDataPoint[]>;
  search(query: string): Promise<SearchResult[]>;
}
