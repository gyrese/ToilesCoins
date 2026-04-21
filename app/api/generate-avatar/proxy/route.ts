import { NextRequest, NextResponse } from 'next/server';

const ALLOWED_HOSTS = ['image.pollinations.ai', 'api.dicebear.com'];

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return NextResponse.json({ error: 'URL manquante' }, { status: 400 });
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(imageUrl);
        } catch {
            return NextResponse.json({ error: 'URL invalide' }, { status: 400 });
        }

        if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
            return NextResponse.json({ error: 'Source non autorisée' }, { status: 403 });
        }

        const response = await fetch(imageUrl);

        if (!response.ok) {
            throw new Error('Erreur lors du téléchargement de l\'image');
        }

        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();

        return new NextResponse(arrayBuffer, {
            headers: {
                'Content-Type': blob.type || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

    } catch (error) {
        console.error('Erreur proxy image:', error);
        return NextResponse.json({ error: 'Erreur lors du chargement de l\'image' }, { status: 500 });
    }
}
