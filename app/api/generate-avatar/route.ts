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
        // On simplifie les paramètres pour garantir la stabilité
        const seed = Math.floor(Math.random() * 1000000);
        const encodedPrompt = encodeURIComponent(prompt);

        // On utilise le modèle par défaut qui est le plus rapide et stable
        // On garde nologo=true
        const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&seed=${seed}&nologo=true`;

        return NextResponse.json({
            imageUrl,
            provider: "pollinations"
        });

    } catch (error) {
        console.error('Erreur génération image:', error);
        return NextResponse.json(
            { error: 'Erreur serveur' },
            { status: 500 }
        );
    }
}
