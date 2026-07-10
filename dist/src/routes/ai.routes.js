"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ai_controller_1 = require("../controllers/ai.controller");
const auth_1 = require("../middlewares/auth");
const asyncHandler_1 = require("../middlewares/asyncHandler");
const router = (0, express_1.Router)();
router.post('/chat', auth_1.authMiddleware, (0, asyncHandler_1.asyncHandler)(ai_controller_1.aiController.chat));
exports.default = router;
