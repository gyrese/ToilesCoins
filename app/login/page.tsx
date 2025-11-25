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
            <div className="min-h-screen flex items-center justify-center bg-[#FFC845]">
                <div className="text-2xl font-black uppercase animate-bounce">Chargement...</div>
            </div>
        );
    }

    return (
        <main className="min-h-screen flex flex-col items-center justify-center p-4 md:p-8 bg-[#FFC845]">

            <div className="w-full max-w-md">
                {/* Logo / Brand */}
                <div className="text-center mb-8">
                    <h1 className="text-5xl font-black uppercase italic tracking-tighter mb-2">ToilesCoins</h1>
                    <p className="font-bold text-lg border-2 border-black inline-block px-2 bg-white transform -rotate-2">La Monnaie de la Culture</p>
                </div>

                {/* Card */}
                <div className="neo-card">
                    <h2 className="text-2xl font-black uppercase mb-6 text-center border-b-4 border-black pb-2">
                        {isSignUp ? "Rejoindre le Club" : "Identification"}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isSignUp && (
                            <div>
                                <label className="block font-bold mb-1 uppercase text-sm">Pseudo</label>
                                <input
                                    type="text"
                                    className="neo-input"
                                    placeholder="Votre Blaze"
                                    value={pseudo}
                                    onChange={(e) => setPseudo(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div>
                            <label className="block font-bold mb-1 uppercase text-sm">Email</label>
                            <input
                                type="email"
                                className="neo-input"
                                placeholder="nom@exemple.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="block font-bold mb-1 uppercase text-sm">Mot de passe</label>
                            <input
                                type="password"
                                className="neo-input"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500 text-white font-bold p-3 border-2 border-black text-center">
                                {error}
                            </div>
                        )}

                        <button type="submit" className="neo-btn w-full mt-4">
                            {isSignUp ? "Créer mon Compte" : "Se Connecter"}
                        </button>

                        <div className="relative my-6 text-center">
                            <span className="bg-white px-2 font-bold text-sm uppercase relative z-10">Ou</span>
                            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-black -z-0"></div>
                        </div>

                        <button type="button" onClick={handleGoogleSignIn} className="neo-btn neo-btn-outline w-full flex items-center justify-center gap-2">
                            <span className="font-black text-xl">G</span> Google
                        </button>

                        <div className="text-center mt-6">
                            <button
                                type="button"
                                onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
                                className="font-bold underline hover:text-gray-600 uppercase text-sm"
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
