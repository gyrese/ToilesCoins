import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { verifyAdmin } from '@/app/lib/auth-server';
import { rateLimit } from '@/app/lib/rate-limiter';

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 Mo

export async function POST(request: NextRequest) {
    const auth = await verifyAdmin(request);
    if (auth instanceof NextResponse) return auth;

    // Max 20 uploads par minute
    if (!rateLimit(`upload:${auth.uid}`, 20, 60_000)) {
        return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
    }

    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
        }

        if (file.size > MAX_SIZE_BYTES) {
            return NextResponse.json({ error: 'Fichier trop volumineux (max 5 Mo)' }, { status: 400 });
        }

        const ext = path.extname(file.name).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return NextResponse.json({ error: 'Type de fichier non autorisé' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, buffer);

        return NextResponse.json({ url: `/uploads/${fileName}` });
    } catch (error) {
        console.error('Erreur upload image:', error);
        return NextResponse.json({ error: 'Erreur upload' }, { status: 500 });
    }
}
