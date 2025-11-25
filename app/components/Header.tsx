"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function Header() {
    const { user, userData, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <header className="neo-header">
            <div className="font-black text-xl tracking-tighter uppercase italic border-2 border-black px-2 bg-yellow-400">
                ToilesCoins
            </div>

            <button
                onClick={handleSignOut}
                className="font-bold text-sm uppercase hover:underline flex items-center gap-2"
            >
                Déconnexion <LogOut size={16} />
            </button>
        </header>
    );
}
