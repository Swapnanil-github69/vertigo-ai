import { Response } from 'express';
import { CustomRequest } from '../middlewares/requestId';
import { geminiService } from '../services/ai/gemini.service';
import { auditLogsRepository } from '../repositories/audit-logs.repository';
import { z } from 'zod';

export class AiController {
  async chat(req: CustomRequest, res: Response): Promise<Response> {
    const user = (req as any).user;
    const { message, history } = z.object({
      message: z.string().min(1),
      history: z.array(
        z.object({
          role: z.enum(['user', 'model']),
          text: z.string(),
        })
      ),
    }).parse(req.body);

    const reply = await geminiService.generateChatResponse(history, message);

    await auditLogsRepository.create({
      user: { connect: { id: user.userId } },
      action: 'AI Chat interaction',
      details: `Inquired AI Copilot: "${message.substring(0, 60)}${message.length > 60 ? '...' : ''}"`,
      ipAddress: req.ip,
    });

    return res.status(200).json({
      success: true,
      message: 'AI reply generated.',
      data: { reply },
      timestamp: new Date().toISOString(),
      requestId: req.requestId || '-',
    });
  }
}

export const aiController = new AiController();
export default aiController;
