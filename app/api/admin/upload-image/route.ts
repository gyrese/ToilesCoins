import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'Fichier manquant' }, { status: 400 });
        }

        const buffer = Buffer.from(await file.arrayBuffer());

        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        await fs.mkdir(uploadsDir, { recursive: true });

        const ext = path.extname(file.name) || '.png';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
        const filePath = path.join(uploadsDir, fileName);

        await fs.writeFile(filePath, buffer);

        const url = `/uploads/${fileName}`;
        return NextResponse.json({ url });
    } catch (error) {
        console.error('Erreur upload image:', error);
        return NextResponse.json({ error: 'Erreur upload' }, { status: 500 });
    }
}

