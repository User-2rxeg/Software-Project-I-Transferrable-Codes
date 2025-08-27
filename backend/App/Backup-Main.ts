import { diskStorage } from 'multer';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

export const ensureUploadsDir = () => {
    const dir = process.env.UPLOAD_DIR || join(process.cwd(), 'uploads');
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return dir;
};

export const storage = diskStorage({
    destination: (_req, _file, cb) => {
        const dir = ensureUploadsDir();
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const original = file.originalname || 'file';
        const dot = original.lastIndexOf('.');
        const ext = dot >= 0 ? original.slice(dot) : ''; // includes the dot
        const base = dot >= 0 ? original.slice(0, dot) : original;
        const safeBase = base.replace(/[^a-zA-Z0-9.-]/g, '');
        const prefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${prefix}-${safeBase}${ext}`);
    },
});


export const fileFilter = (_req: any, file: Express.Multer.File, cb: (err: any, ok: boolean) => void) => {
    // allow: pdf, videos, images (optional)
    const okTypes = [
        'application/pdf',
        'video/mp4',
        'video/webm',
        'video/quicktime',
        'image/png',
        'image/jpeg',
        'image/webp',
    ];
    if (okTypes.includes(file.mimetype)) return cb(null, true);
    cb(new Error('Unsupported file type'), false);
};

export const limits = {
    fileSize: 50 * 1024 * 1024, // 50MB
};