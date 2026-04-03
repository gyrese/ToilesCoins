"use client";

import { useAuth } from "../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { LogOut, Coins } from "lucide-react";

export default function Header() {
    const { user, userData, signOut } = useAuth();
    const router = useRouter();

    const handleSignOut = async () => {
        await signOut();
        router.push("/login");
    };

    if (!user) return null;

    return (
        <header style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-default)',
            padding: '0 1rem',
            height: 'var(--header-height)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 100,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
        }}>
            <div className="font-payback" style={{ fontSize: '1.25rem', color: 'var(--accent-gold)', letterSpacing: '0.04em' }}>
                ToilesCoins
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {userData && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                        background: 'var(--accent-gold-dim)', border: '1px solid var(--accent-gold-border)',
                        borderRadius: '999px', padding: '0.3rem 0.875rem',
                        fontFamily: 'var(--font-display)', fontSize: '0.85rem', color: 'var(--accent-gold)',
                        whiteSpace: 'nowrap',
                    }}>
                        <Coins size={13} />
                        {userData.balance ?? 0} TC
                    </div>
                )}
                <button
                    onClick={handleSignOut}
                    title="Déconnexion"
                    style={{
                        background: 'transparent', border: '1px solid var(--border-strong)',
                        borderRadius: '10px', padding: '0.4rem 0.75rem',
                        color: 'var(--text-secondary)', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase',
                        transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--accent-gold)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent-gold)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-strong)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'; }}
                >
                    <LogOut size={15} />
                </button>
            </div>
        </header>
    );
}
