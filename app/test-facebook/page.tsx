"use client";

import { useState } from "react";

export default function TestFacebook() {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState("");

    const testFacebookAPI = async () => {
        setLoading(true);
        setError("");
        setResult(null);

        try {
            const response = await fetch('/api/facebook-events');
            const data = await response.json();

            if (!response.ok) {
                setError(JSON.stringify(data, null, 2));
            } else {
                setResult(data);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FFC845] p-8">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-black uppercase mb-8 text-center">
                    🧪 Test Facebook API
                </h1>

                <div className="bg-white border-4 border-black rounded-2xl p-6 mb-6">
                    <button
                        onClick={testFacebookAPI}
                        disabled={loading}
                        className="w-full bg-black text-[#FFC845] font-black text-xl py-4 px-8 rounded-lg border-4 border-black hover:bg-gray-800 disabled:opacity-50 transition-all"
                    >
                        {loading ? "⏳ Test en cours..." : "🚀 Tester la connexion Facebook"}
                    </button>
                </div>

                {error && (
                    <div className="bg-red-200 border-4 border-red-600 rounded-2xl p-6 mb-6">
                        <h2 className="text-2xl font-black text-red-800 mb-4">❌ ERREUR</h2>
                        <pre className="bg-white p-4 rounded border-2 border-red-400 overflow-auto text-sm">
                            {error}
                        </pre>
                        <div className="mt-4 text-sm">
                            <p className="font-bold mb-2">Vérifications à faire :</p>
                            <ul className="list-disc list-inside space-y-1">
                                <li>Le FACEBOOK_PAGE_ID est-il correct ?</li>
                                <li>Le FACEBOOK_ACCESS_TOKEN est-il valide ?</li>
                                <li>Le token a-t-il les permissions nécessaires ?</li>
                                <li>As-tu redémarré le serveur après avoir modifié .env.local ?</li>
                            </ul>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="bg-green-200 border-4 border-green-600 rounded-2xl p-6">
                        <h2 className="text-2xl font-black text-green-800 mb-4">
                            ✅ SUCCÈS - {result.events?.length || 0} événements trouvés
                        </h2>

                        {result.events && result.events.length > 0 ? (
                            <div className="space-y-4">
                                {result.events.map((event: any, index: number) => (
                                    <div key={event.id} className="bg-white border-2 border-green-400 rounded-lg p-4">
                                        <div className="font-black text-lg mb-2">
                                            {index + 1}. {event.name}
                                        </div>
                                        <div className="text-sm space-y-1">
                                            <p><strong>ID:</strong> {event.id}</p>
                                            <p><strong>Date:</strong> {new Date(event.start_time).toLocaleString('fr-FR')}</p>
                                            {event.description && (
                                                <p><strong>Description:</strong> {event.description.substring(0, 100)}...</p>
                                            )}
                                            {event.place && (
                                                <p><strong>Lieu:</strong> {event.place.name}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-center font-bold">
                                Aucun événement trouvé sur cette page Facebook.
                            </p>
                        )}

                        <details className="mt-6">
                            <summary className="cursor-pointer font-bold text-green-800 hover:text-green-600">
                                📋 Voir les données brutes (JSON)
                            </summary>
                            <pre className="bg-white p-4 rounded border-2 border-green-400 overflow-auto text-xs mt-2">
                                {JSON.stringify(result, null, 2)}
                            </pre>
                        </details>
                    </div>
                )}

                {!loading && !result && !error && (
                    <div className="bg-white border-4 border-black rounded-2xl p-6 text-center">
                        <p className="text-xl font-bold mb-4">
                            👆 Clique sur le bouton pour tester ta connexion Facebook
                        </p>
                        <div className="text-sm text-left space-y-2">
                            <p className="font-bold">Ce test va vérifier :</p>
                            <ul className="list-disc list-inside space-y-1 ml-4">
                                <li>Si ton FACEBOOK_PAGE_ID est correct</li>
                                <li>Si ton FACEBOOK_ACCESS_TOKEN est valide</li>
                                <li>Si les permissions sont correctes</li>
                                <li>Si l'API Facebook répond correctement</li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
