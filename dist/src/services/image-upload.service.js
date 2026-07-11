"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const uuid_1 = require("uuid");
const errors_1 = require("../utils/errors");
// Configure disk storage in src/uploads
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, path_1.default.resolve(__dirname, '../uploads'));
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = (0, uuid_1.v4)();
        const ext = path_1.default.extname(file.originalname);
        cb(null, `avatar-${uniqueSuffix}${ext}`);
    },
});
// File filter to restrict uploads to images only
const fileFilter = (_req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.BadRequestError('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
