import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const { prompt } = await request.json();

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt requis' },
                { status: 400 }
            );
        }

        // Utilisation de Pollinations.ai
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

        // Télécharger l'image et la convertir en base64
        const maxRetries = 3;
        let lastError;

        for (let i = 0; i < maxRetries; i++) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

                const response = await fetch(imageUrl, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'User-Agent': 'Mozilla/5.0'
                    }
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    // Convertir l'image en base64
                    const arrayBuffer = await response.arrayBuffer();
                    const base64 = Buffer.from(arrayBuffer).toString('base64');
                    const dataUrl = `data:image/jpeg;base64,${base64}`;

                    return NextResponse.json({ imageUrl: dataUrl });
                }

                lastError = `HTTP ${response.status}: ${response.statusText}`;
            } catch (err: any) {
                lastError = err.message;
                if (i < maxRetries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                }
            }
        }

        throw new Error(`Échec après ${maxRetries} tentatives: ${lastError}`);

    } catch (error: any) {
        console.error('Erreur génération image:', error);
        return NextResponse.json(
            { error: error.message || 'Erreur serveur' },
            { status: 500 }
        );
    }
}
