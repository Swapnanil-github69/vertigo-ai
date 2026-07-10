"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.aiController = exports.AiController = void 0;
const gemini_service_1 = require("../services/ai/gemini.service");
const audit_logs_repository_1 = require("../repositories/audit-logs.repository");
const zod_1 = require("zod");
class AiController {
    async chat(req, res) {
        const user = req.user;
        const { message, history } = zod_1.z.object({
            message: zod_1.z.string().min(1),
            history: zod_1.z.array(zod_1.z.object({
                role: zod_1.z.enum(['user', 'model']),
                text: zod_1.z.string(),
            })),
        }).parse(req.body);
        const reply = await gemini_service_1.geminiService.generateChatResponse(history, message);
        await audit_logs_repository_1.auditLogsRepository.create({
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
exports.AiController = AiController;
exports.aiController = new AiController();
exports.default = exports.aiController;
