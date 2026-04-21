import { NextRequest, NextResponse } from 'next/server';
import { rateLimit } from '@/app/lib/rate-limiter';

export async function POST(request: NextRequest) {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimit(`avatar:${ip}`, 5, 60_000)) {
        return NextResponse.json({ error: 'Trop de requêtes, réessayez dans une minute' }, { status: 429 });
    }

    try {
        const { prompt } = await request.json();

        if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
            return NextResponse.json({ error: 'Prompt requis' }, { status: 400 });
        }

        if (prompt.length > 500) {
            return NextResponse.json({ error: 'Prompt trop long (max 500 caractères)' }, { status: 400 });
        }

        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt.trim());
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

        const maxRetries = 3;
        let lastError: string = '';

        for (let i = 0; i < maxRetries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000);

                const response = await fetch(imageUrl, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0' }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const arrayBuffer = await response.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    const dataUrl = `data:image/jpeg;base64,${base64}`;
                    return NextResponse.json({ imageUrl: dataUrl });
                }

                lastError = `HTTP ${response.status}: ${response.statusText}`;
            } catch (err: unknown) {
                lastError = err instanceof Error ? err.message : 'Erreur inconnue';
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }

        throw new Error(`Échec après ${maxRetries} tentatives: ${lastError}`);

    } catch (error: unknown) {
        console.error('Erreur génération image:', error);
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
}
