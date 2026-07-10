import { IStockProvider, StockQuote, CompanyProfile, HistoricalDataPoint, SearchResult } from './stockProvider.interface';

const COMPANY_PROFILES: Record<string, CompanyProfile> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Consumer Electronics',
    description: 'Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide.',
    logo: 'https://logo.clearbit.com/apple.com',
    weburl: 'https://www.apple.com',
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Semiconductors',
    description: 'NVIDIA Corporation focuses on personal computer graphics, graphics processing units, and also on artificial intelligence solutions.',
    logo: 'https://logo.clearbit.com/nvidia.com',
    weburl: 'https://www.nvidia.com',
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    sector: 'Technology',
    industry: 'Software - Infrastructure',
    description: 'Microsoft Corporation develops, licenses, and supports software, services, devices, and solutions worldwide.',
    logo: 'https://logo.clearbit.com/microsoft.com',
    weburl: 'https://www.microsoft.com',
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    sector: 'Consumer Cyclical',
    industry: 'Auto Manufacturers',
    description: 'Tesla, Inc. designs, develops, manufactures, leases, and sells electric vehicles, and energy generation and storage systems.',
    logo: 'https://logo.clearbit.com/tesla.com',
    weburl: 'https://www.tesla.com',
  },
  'BTC.X': {
    symbol: 'BTC.X',
    name: 'Bitcoin USD',
    exchange: 'Cryptocurrency',
    sector: 'Cryptocurrency',
    industry: 'Digital Currency',
    description: 'Bitcoin is a decentralized digital currency, without a central bank or single administrator, that can be sent from user to user on the peer-to-peer bitcoin network.',
    logo: 'https://logo.clearbit.com/bitcoin.org',
    weburl: 'https://bitcoin.org',
  },
};

const BASE_PRICES: Record<string, number> = {
  AAPL: 180.50,
  NVDA: 900.20,
  MSFT: 420.10,
  TSLA: 175.40,
  'BTC.X': 65000.00,
};

export class MockDataProvider implements IStockProvider {
  async getQuote(symbol: string): Promise<StockQuote> {
    const cleanSym = symbol.toUpperCase();
    const basePrice = BASE_PRICES[cleanSym] || 100.00;
    
    // Generate fluctuating price based on current time (minute/second changes)
    const minutes = new Date().getMinutes() + new Date().getSeconds() / 60;
    const rawFluct = Math.sin(minutes) * 0.02 + (Math.cos(minutes * 2) * 0.01);
    const price = parseFloat((basePrice * (1 + rawFluct)).toFixed(2));
    const previousClose = parseFloat((basePrice * 0.99).toFixed(2));
    const change = parseFloat((price - previousClose).toFixed(2));
    const changePercent = parseFloat(((change / previousClose) * 100).toFixed(2));

    return {
      symbol: cleanSym,
      price,
      change,
      changePercent,
      high: parseFloat((price * 1.01).toFixed(2)),
      low: parseFloat((price * 0.99).toFixed(2)),
      open: parseFloat((previousClose * 1.002).toFixed(2)),
      previousClose,
      volume: 1200000 + Math.floor(Math.random() * 500000),
      timestamp: new Date(),
    };
  }

  async getProfile(symbol: string): Promise<CompanyProfile> {
    const cleanSym = symbol.toUpperCase();
    return COMPANY_PROFILES[cleanSym] || {
      symbol: cleanSym,
      name: `${cleanSym} Corp`,
      exchange: 'NYSE',
      sector: 'General',
      industry: 'Conglomerate',
      description: `${cleanSym} is a tracked asset in Vertigo Terminal intelligence matrices.`,
      logo: '',
      weburl: '',
    };
  }

  async getHistory(symbol: string, _interval: string = '1day', outputsize: number = 30): Promise<HistoricalDataPoint[]> {
    const cleanSym = symbol.toUpperCase();
    const basePrice = BASE_PRICES[cleanSym] || 100.00;
    const history: HistoricalDataPoint[] = [];

    const now = new Date();
    for (let i = outputsize - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      const dayFactor = i / 10;
      const rawFluct = Math.sin(dayFactor) * 0.05 + Math.cos(dayFactor * 1.5) * 0.02;
      const close = parseFloat((basePrice * (1 - rawFluct)).toFixed(2));
      const open = parseFloat((close * (1 + (Math.random() - 0.5) * 0.01)).toFixed(2));
      const high = parseFloat((Math.max(open, close) * (1 + Math.random() * 0.008)).toFixed(2));
      const low = parseFloat((Math.min(open, close) * (1 - Math.random() * 0.008)).toFixed(2));

      history.push({
        time: date.toISOString().split('T')[0],
        open,
        high,
        low,
        close,
        volume: 800000 + Math.floor(Math.random() * 300000),
      });
    }

    return history;
  }

  async search(query: string): Promise<SearchResult[]> {
    const cleanQuery = query.toUpperCase();
    const all = Object.keys(COMPANY_PROFILES).map((sym) => ({
      symbol: sym,
      name: COMPANY_PROFILES[sym].name,
      exchange: COMPANY_PROFILES[sym].exchange,
      type: sym === 'BTC.X' ? 'Cryptocurrency' : 'Common Stock',
    }));

    return all.filter(
      (item) => item.symbol.includes(cleanQuery) || item.name.toUpperCase().includes(cleanQuery)
    );
  }
}
