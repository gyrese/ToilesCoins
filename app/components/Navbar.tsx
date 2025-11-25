"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Wallet, ShoppingBag, User, ShieldAlert, Ticket } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export default function Navbar() {
    const pathname = usePathname();
    const { userData } = useAuth();

    const isActive = (path: string) => pathname === path;

    return (
        <nav className="neo-nav">
            <Link href="/dashboard" className={`neo-nav-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <Home size={24} strokeWidth={3} />
            </Link>

            <Link href="/wallet" className={`neo-nav-link ${isActive('/wallet') ? 'active' : ''}`}>
                <Wallet size={24} strokeWidth={3} />
            </Link>

            <Link href="/shop" className={`neo-nav-link ${isActive('/shop') ? 'active' : ''}`}>
                <ShoppingBag size={24} strokeWidth={3} />
            </Link>

            <Link href="/coupons" className={`neo-nav-link ${isActive('/coupons') ? 'active' : ''}`}>
                <Ticket size={24} strokeWidth={3} />
            </Link>

            <Link href="/profile" className={`neo-nav-link ${isActive('/profile') ? 'active' : ''}`}>
                <User size={24} strokeWidth={3} />
            </Link>

            {userData?.role === "ADMIN" && (
                <Link href="/admin" className={`neo-nav-link ${isActive('/admin') ? 'active !bg-red-500 !text-white' : '!text-red-400'}`}>
                    <ShieldAlert size={24} strokeWidth={3} />
                </Link>
            )}
        </nav>
    );
}
