"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    User,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    onAuthStateChanged,
    GoogleAuthProvider,
    signInWithPopup
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

interface UserData {
    uid: string;
    email: string;
    pseudo: string;
    avatar?: string;
    photoURL?: string;
    bio?: string;
    role: "USER" | "ADMIN";
    balance: number;
    wins: number;
    eventsCount: number;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, pseudo: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | undefined;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user) {
                // Écouter les changements du document utilisateur en temps réel
                unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (doc) => {
                    if (doc.exists()) {
                        setUserData(doc.data() as UserData);
                    } else {
                        console.log("Document utilisateur introuvable !");
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Erreur d'écoute Firestore:", error);
                    setLoading(false);
                });
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        // Timeout de sécurité : si au bout de 5s rien ne se passe, on arrête le chargement
        const timeout = setTimeout(() => {
            setLoading((currentLoading) => {
                if (currentLoading) {
                    console.warn("Timeout du chargement AuthContext");
                    return false;
                }
                return currentLoading;
            });
        }, 5000);

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) unsubscribeSnapshot();
            clearTimeout(timeout);
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string, pseudo: string) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);

        // Créer le document utilisateur dans Firestore
        const newUserData: UserData = {
            uid: userCredential.user.uid,
            email: userCredential.user.email!,
            pseudo,
            photoURL: `https://api.dicebear.com/9.x/avataaars/svg?seed=${pseudo}`,
            role: "USER",
            balance: 0,
            wins: 0,
            eventsCount: 0,
        };

        await setDoc(doc(db, "users", userCredential.user.uid), newUserData);
        setUserData(newUserData);
    };

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);

        // Vérifier si l'utilisateur existe déjà
        const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

        if (!userDoc.exists()) {
            // Créer un nouveau document utilisateur
            const newUserData: UserData = {
                uid: userCredential.user.uid,
                email: userCredential.user.email!,
                pseudo: userCredential.user.displayName || "Joueur",
                photoURL: userCredential.user.photoURL || `https://api.dicebear.com/9.x/avataaars/svg?seed=${userCredential.user.uid}`,
                role: "USER",
                balance: 0,
                wins: 0,
                eventsCount: 0,
            };

            await setDoc(doc(db, "users", userCredential.user.uid), newUserData);
            setUserData(newUserData);
        }
    };

    const signOut = async () => {
        await firebaseSignOut(auth);
        setUserData(null);
    };

    const value = {
        user,
        userData,
        loading,
        signIn,
        signUp,
        signInWithGoogle,
        signOut,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
