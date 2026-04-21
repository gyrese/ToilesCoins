import { NextRequest, NextResponse } from 'next/server';

export async function GET(_request: NextRequest) {
    try {
        const FB_PAGE_ID = process.env.FACEBOOK_PAGE_ID;
        const FB_ACCESS_TOKEN = process.env.FACEBOOK_ACCESS_TOKEN;

        if (!FB_PAGE_ID || !FB_ACCESS_TOKEN) {
            return NextResponse.json({
                error: 'Configuration Facebook manquante. Ajoutez FACEBOOK_PAGE_ID et FACEBOOK_ACCESS_TOKEN dans .env.local'
            }, { status: 500 });
        }

        let response = await fetch(
            `https://graph.facebook.com/v19.0/${FB_PAGE_ID}?fields=events{id,name,description,start_time,end_time,place,cover}&access_token=${FB_ACCESS_TOKEN}`,
            { headers: { 'Content-Type': 'application/json' } }
        );

        if (!response.ok) {
            response = await fetch(
                `https://graph.facebook.com/v19.0/${FB_PAGE_ID}/published_posts?fields=id,message,created_time,attachments{title,description,media_type}&limit=50&access_token=${FB_ACCESS_TOKEN}`,
                { headers: { 'Content-Type': 'application/json' } }
            );
        }

        if (!response.ok) {
            return NextResponse.json({
                error: 'Impossible de récupérer les événements Facebook',
                suggestion: 'Vous pouvez ajouter les tournois manuellement dans l\'admin.'
            }, { status: response.status });
        }

        const data = await response.json();
        const events = data.events?.data || data.data || [];

        return NextResponse.json({
            events,
            paging: data.paging || null,
            note: events.length === 0 ? 'Aucun événement trouvé. Vous pouvez ajouter les tournois manuellement.' : null
        });

    } catch (error: unknown) {
        console.error('Erreur Facebook events:', error);
        return NextResponse.json({
            error: 'Erreur serveur',
            suggestion: 'Vous pouvez ajouter les tournois manuellement dans l\'admin.'
        }, { status: 500 });
    }
}
