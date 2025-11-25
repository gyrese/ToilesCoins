"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Coin from "../components/Coin";

interface Transaction {
    id: string;
    amount: number;
    type: "EARN" | "SPEND";
    description: string;
    date: string;
}

export default function Wallet() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;

            try {
                const q = query(
                    collection(db, "transactions"),
                    where("userId", "==", user.uid),
                    orderBy("date", "desc")
                );
                const snapshot = await getDocs(q);
                const txs = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];
                setTransactions(txs);
            } catch (error) {
                console.error("Erreur chargement transactions:", error);
            }
        };

        if (user) {
            fetchTransactions();
        }
    }, [user]);

    if (loading || !user || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="pixel-box">Chargement...</div>
            </div>
        );
    }

    return (
        <main className="pb-20">
            <div className="pixel-box pixel-box-warning text-center">
                <h1 className="text-xl mb-2">Portefeuille</h1>
            </div>

            <div className="pixel-box text-center py-8">
                <div className="text-4xl text-[#e52521] flex justify-center items-center gap-4">
                    <Coin />
                    <span>{userData.balance}</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">ToilesCoins disponibles</p>
            </div>

            <div className="p-4">
                <h3 className="text-white mb-4">Historique</h3>

                {transactions.length === 0 ? (
                    <div className="pixel-box text-center text-xs text-gray-500">
                        Aucune transaction
                    </div>
                ) : (
                    transactions.map((tx) => (
                        <div key={tx.id} className="pixel-box flex justify-between items-center !my-2 !p-2">
                            <div>
                                <p className="text-xs font-bold">{tx.description}</p>
                                <p className="text-[10px] text-gray-500">
                                    {new Date(tx.date).toLocaleDateString('fr-FR')}
                                </p>
                            </div>
                            <div className={`flex items-center gap-1 text-sm ${tx.type === 'EARN' ? 'text-[#43b047]' : 'text-[#e52521]'}`}>
                                {tx.type === 'EARN' ? '+' : '-'}{Math.abs(tx.amount)}
                            </div>
                        </div>
                    ))
                )}
            </div>

            <Navbar />
        </main>
    );
}
