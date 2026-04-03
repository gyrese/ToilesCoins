"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ShoppingBag, ShieldAlert, Ticket, Calendar } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

const navLinks = [
    { href: '/profile', icon: Home, label: 'Profil' },
    { href: '/shop', icon: ShoppingBag, label: 'Boutique' },
    { href: '/coupons', icon: Ticket, label: 'Coupons' },
    { href: '/events', icon: Calendar, label: 'Events' },
];

export default function Navbar() {
    const pathname = usePathname();
    const { userData } = useAuth();

    const isActive = (path: string) => pathname === path;

    const linkStyle = (active: boolean, isAdmin = false): React.CSSProperties => ({
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        padding: '0.5rem 0.75rem',
        borderRadius: '12px',
        color: active ? (isAdmin ? 'var(--accent-red)' : 'var(--accent-gold)') : (isAdmin ? 'rgba(255,68,68,0.45)' : 'var(--text-muted)'),
        fontSize: '0.6rem',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        textDecoration: 'none',
        position: 'relative',
        minWidth: '52px',
        transition: 'color 0.15s',
    });

    const indicatorStyle = (active: boolean, isAdmin = false): React.CSSProperties => active ? {
        position: 'absolute',
        top: '-1px',
        left: '25%',
        right: '25%',
        height: '2px',
        background: isAdmin ? 'var(--accent-red)' : 'var(--accent-gold)',
        borderRadius: '0 0 999px 999px',
        boxShadow: `0 0 8px ${isAdmin ? 'var(--accent-red)' : 'var(--accent-gold)'}`,
    } : { display: 'none' };

    return (
        <nav style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            height: 'var(--navbar-height)',
            backgroundColor: 'var(--bg-surface)',
            borderTop: '1px solid var(--border-default)',
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0 0.5rem',
            paddingBottom: 'env(safe-area-inset-bottom)',
            zIndex: 100,
        }}>
            {navLinks.map(({ href, icon: Icon, label }) => {
                const active = isActive(href);
                return (
                    <Link key={href} href={href} style={linkStyle(active)}>
                        <span style={indicatorStyle(active)} />
                        <Icon size={22} strokeWidth={active ? 2.5 : 2} />
                        <span>{label}</span>
                    </Link>
                );
            })}

            {userData?.role === "ADMIN" && (
                <Link href="/admin" style={linkStyle(isActive('/admin'), true)}>
                    <span style={indicatorStyle(isActive('/admin'), true)} />
                    <ShieldAlert size={22} strokeWidth={isActive('/admin') ? 2.5 : 2} />
                    <span>Admin</span>
                </Link>
            )}
        </nav>
    );
}
