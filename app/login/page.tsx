"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pseudo, setPseudo] = useState("");
    const [error, setError] = useState("");
    const [isRedirecting, setIsRedirecting] = useState(false);
    const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();

    useEffect(() => {
        if (!loading && user && !isRedirecting) {
            setIsRedirecting(true);
            router.push("/dashboard");
        }
    }, [user, loading, router, isRedirecting]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        try {
            if (isSignUp) {
                await signUp(email, password, pseudo);
            } else {
                await signIn(email, password);
            }
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue");
        }
    };

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || "Erreur de connexion Google");
        }
    };

    if (loading || isRedirecting) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)]">
                <div className="text-2xl font-black uppercase animate-bounce">Chargement...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[var(--bg-base)]">

            <div className="w-full max-w-sm">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <h1 className="font-payback text-5xl uppercase mb-2" style={{ color: 'var(--accent-gold)', textShadow: '0 0 30px rgba(255,200,69,0.25)' }}>ToilesCoins</h1>
                    <p style={{ fontWeight: 700, fontSize: '0.85rem', border: '1px solid var(--accent-gold-border)', display: 'inline-block', padding: '3px 12px', borderRadius: 'var(--radius-pill)', color: 'var(--accent-gold)', background: 'var(--accent-gold-dim)' }}>La monnaie des Toiles</p>
                </div>

                {/* Card */}
                <div className="dark-card dark-card--neo">
                    <h2 className="font-payback text-xl uppercase mb-6 text-center pb-3" style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--border-default)' }}>
                        {isSignUp ? "Rejoindre le Club" : "Identification"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="dark-label">Pseudo</label>
                                <input
                                    type="text"
                                    className="dark-input"
                                    placeholder="Votre Blaze"
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="dark-label">Email</label>
                            <input
                                type="email"
                                className="dark-input"
                                placeholder="nom@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="dark-label">Mot de passe</label>
                            <input
                                type="password"
                                className="dark-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="toast toast-error" style={{ animation: 'none' }}>
                                {error}
                            </div>
                        )}

                        <button type="submit" className="btn-primary mt-4">
                            {isSignUp ? "Créer mon Compte" : "Se Connecter"}
                        </button>

                        <div style={{ position: 'relative', textAlign: 'center', margin: '1.25rem 0' }}>
                            <span style={{ background: 'var(--bg-surface)', padding: '0 0.75rem', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}>Ou</span>
                            <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '1px', background: 'var(--border-default)', zIndex: 0 }} />
                        </div>

                        <button type="button" onClick={handleGoogleSignIn} className="btn-ghost w-full flex items-center justify-center gap-2" style={{ width: '100%' }}>
                            <span className="font-black text-xl">G</span> Google
                        </button>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                                style={{ fontWeight: 700, textDecoration: 'underline', fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                {isSignUp ? "J'ai déjà un compte" : "Pas encore de compte ?"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
}
