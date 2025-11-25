"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Header from "../components/Header";
import { Trophy, Coins, User, Zap, Download, Save } from "lucide-react";

export default function Profile() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [generatedImage, setGeneratedImage] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [currentAvatar, setCurrentAvatar] = useState("");
    const [aiPrompt, setAiPrompt] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);
    const particlesRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
            return;
        }
        if (userData?.photoURL) {
            setCurrentAvatar(userData.photoURL);
        } else if (userData?.pseudo) {
            setCurrentAvatar(`https://api.dicebear.com/9.x/avataaars/svg?seed=${userData.pseudo}&backgroundColor=ffc845`);
        }
    }, [user, loading, router, userData]);

    // Effet particules
    useEffect(() => {
        if (!particlesRef.current) return;

        const interval = setInterval(() => {
            if (!particlesRef.current) return;
            const p = document.createElement("div");
            p.classList.add("particle");
            p.style.left = Math.random() * 100 + "%";
            p.style.animationDuration = 2 + Math.random() * 2 + "s";
            particlesRef.current.appendChild(p);
            setTimeout(() => p.remove(), 3000);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    const saveAsAvatar = async () => {
        if (!user || !generatedImage) return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), { photoURL: generatedImage });
            setCurrentAvatar(generatedImage);
            alert("✅ Nouvelle photo de profil définie !");
        } catch (error) {
            console.error(error);
            alert("❌ Erreur lors de la sauvegarde");
        } finally {
            setIsSaving(false);
        }
    };

    const downloadImage = async () => {
        if (!generatedImage) return;
        try {
            const response = await fetch(generatedImage);
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `creation-ia-${Date.now()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Erreur téléchargement:", error);
            // Fallback si le fetch échoue (CORS)
            window.open(generatedImage, '_blank');
        }
    };

    const generateAIImage = async () => {
        if (!aiPrompt.trim()) {
            alert("🕹️ Entre une description !");
            return;
        }

        setIsGenerating(true);
        setGeneratedImage("");
        setProgress(0);

        // Animation de chargement
        const interval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 95) return prev;
                return prev + Math.random() * 2;
            });
        }, 100);

        try {
            const response = await fetch('/api/generate-avatar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt: aiPrompt })
            });

            if (!response.ok) throw new Error("Erreur de génération");

            const data = await response.json();

            // Simulation de fin de chargement
            clearInterval(interval);
            setProgress(100);

            // Petit délai pour l'effet
            setTimeout(() => {
                setGeneratedImage(data.imageUrl);
                setIsGenerating(false);
            }, 500);

        } catch (error) {
            clearInterval(interval);
            setIsGenerating(false);
            alert("⚠️ Erreur de génération");
        }
    };

    if (loading || (user && !userData)) {
        return <div className="min-h-screen flex items-center justify-center font-bold text-xl bg-[#FFC845]">CHARGEMENT...</div>;
    }
    if (!user) return null;

    return (
        <>
            <Header />
            <main className="layout-container pb-32">
                <div className="mb-8">
                    <h1 className="text-4xl font-black uppercase italic mb-2">👤 Mon Profil</h1>
                    <p className="font-bold opacity-70">Zone Créative & Identité</p>
                </div>

                {/* Profile Card */}
                <div className="neo-card !bg-gradient-to-br from-purple-400 to-pink-500 !border-purple-600 mb-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                    <div className="relative z-10">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full border-4 border-black overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute -bottom-2 -right-2 bg-yellow-400 border-2 border-black rounded-full p-2">
                                    <Zap size={20} className="text-black" />
                                </div>
                            </div>
                            <div className="flex-1 text-center md:text-left">
                                <h2 className="text-3xl font-black uppercase text-white mb-1">{userData?.pseudo}</h2>
                                <p className="font-bold text-white/80 mb-4 flex items-center gap-2 justify-center md:justify-start">
                                    <User size={16} />
                                    {user.email}
                                </p>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white/90 backdrop-blur rounded-lg p-3 border-2 border-black">
                                        <div className="flex items-center gap-2 justify-center mb-1">
                                            <Coins className="text-yellow-600" size={20} />
                                            <span className="text-xs font-bold opacity-70">SOLDE</span>
                                        </div>
                                        <div className="text-2xl font-black">{userData?.balance || 0} <span className="text-yellow-600">TC</span></div>
                                    </div>
                                    <div className="bg-white/90 backdrop-blur rounded-lg p-3 border-2 border-black">
                                        <div className="flex items-center gap-2 justify-center mb-1">
                                            <Trophy className="text-purple-600" size={20} />
                                            <span className="text-xs font-bold opacity-70">VICTOIRES</span>
                                        </div>
                                        <div className="text-2xl font-black">{userData?.wins || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ===== RETRO GENERATOR SECTION ===== */}
                <div className="retro-mode crt">
                    <div className="section-title">
                        <h2>Les Toiles Noires</h2>
                        <p>🕹️ Studio de Création IA 🎨</p>
                    </div>

                    <div className="generator-box">
                        <div className="particles" ref={particlesRef}></div>

                        <input
                            type="text"
                            className="form-control-retro"
                            placeholder="Ex: paysage cyberpunk, dragon en or, logo futuriste..."
                            value={aiPrompt}
                            onChange={(e) => setAiPrompt(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && generateAIImage()}
                        />

                        <button
                            className="start-btn"
                            onClick={generateAIImage}
                            disabled={isGenerating}
                        >
                            {isGenerating ? "DISTILLATION..." : "▶ GÉNÉRER L'IMAGE"}
                        </button>

                        {isGenerating && (
                            <div style={{ marginTop: '25px' }}>
                                <div style={{ fontSize: '10px', color: '#ffcc66', marginBottom: '10px' }}>
                                    CRÉATION DE L'IMAGE EN COURS...
                                </div>
                                <div className="progress-bar-retro">
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>
                            </div>
                        )}

                        {generatedImage && !isGenerating && (
                            <div className="animate-in fade-in zoom-in duration-500">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    key={generatedImage} // Force re-render
                                    src={`${generatedImage}&t=${Date.now()}`} // Force new request
                                    alt="Generated Art"
                                    className="generated-img"
                                    onError={(e) => {
                                        console.error("Erreur chargement image");
                                        e.currentTarget.style.display = 'none';
                                    }}
                                />

                                <div className="mt-4 flex flex-col gap-3 justify-center items-center">
                                    {/* Bouton Télécharger */}
                                    <button
                                        className="start-btn"
                                        style={{ background: '#8fd8ff', color: 'black', width: '100%', maxWidth: '300px' }}
                                        onClick={downloadImage}
                                    >
                                        <Download size={16} className="inline mr-2" />
                                        💾 TÉLÉCHARGER
                                    </button>

                                    {/* Bouton Définir en Avatar */}
                                    <button
                                        className="start-btn"
                                        style={{ background: '#ffcc66', color: 'black', width: '100%', maxWidth: '300px' }}
                                        onClick={saveAsAvatar}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? "SAUVEGARDE..." : (
                                            <>
                                                <Save size={16} className="inline mr-2" />
                                                DÉFINIR EN AVATAR
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </main>
            <Navbar />
        </>
    );
}
