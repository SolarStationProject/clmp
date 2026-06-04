import multer from 'multer';
import path from 'path';
import fs from 'fs';

const MAX_MB = parseInt(process.env.UPLOAD_MAX_SIZE_MB || '5');

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path.join(__dirname, '..', '..', 'uploads', 'reports');
        fs.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten imágenes JPG, PNG o WebP.'));
    }
};

export const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_MB * 1024 * 1024 },
});
