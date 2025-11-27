import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json(
                { error: 'URL manquante' },
                { status: 400 }
            );
        }

        // Récupérer l'image depuis Pollinations
        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error('Erreur lors du téléchargement de l\'image');
        }

        // Récupérer le blob de l'image
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        // Retourner l'image avec les bons headers CORS
        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': blob.type || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
                'Access-Control-Allow-Origin': '*',
            },
        });

    } catch (error) {
        console.error('Erreur proxy image:', error);
        return NextResponse.json(
            { error: 'Erreur lors du chargement de l\'image' },
            { status: 500 }
        );
    }
}
