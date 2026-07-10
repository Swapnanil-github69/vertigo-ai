import { Response } from 'express';
import { CustomRequest } from '../middlewares/requestId';
import { stockService } from '../services/stock/stock.service';
import { z } from 'zod';

export class StockController {
  async getQuote(req: CustomRequest, res: Response): Promise<Response> {
    const { symbol } = z.object({ symbol: z.string().min(1) }).parse(req.query);
    const quote = await stockService.getQuote(symbol);
    return res.status(200).json({
      success: true,
      message: 'Quote retrieved.',
      data: quote,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async getProfile(req: CustomRequest, res: Response): Promise<Response> {
    const { symbol } = z.object({ symbol: z.string().min(1) }).parse(req.query);
    const profile = await stockService.getProfile(symbol);
    return res.status(200).json({
      success: true,
      message: 'Company profile retrieved.',
      data: profile,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async getHistory(req: CustomRequest, res: Response): Promise<Response> {
    const { symbol, interval, outputsize } = z.object({
      symbol: z.string().min(1),
      interval: z.string().optional(),
      outputsize: z.preprocess((val) => (val ? parseInt(val as string) : undefined), z.number().optional()),
    }).parse(req.query);

    const history = await stockService.getHistory(symbol, interval || '1day', outputsize || 30);
    return res.status(200).json({
      success: true,
      message: 'Historical price vector retrieved.',
      data: history,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }

  async search(req: CustomRequest, res: Response): Promise<Response> {
    const { query } = z.object({ query: z.string().min(1) }).parse(req.query);
    const results = await stockService.search(query);
    return res.status(200).json({
      success: true,
      message: 'Symbols parsed.',
      data: results,
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }
}

export const stockController = new StockController();
export default stockController;
