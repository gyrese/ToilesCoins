/**
 * Rate limiter en mémoire simple (par IP, sans Redis).
 * Convient pour un usage à faible trafic (club associatif).
 */

interface RateLimitEntry {
    count: number;
    resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Nettoyage périodique pour éviter les fuites mémoire
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
        if (entry.resetAt < now) store.delete(key);
    }
}, 60_000);

/**
 * @param key      Identifiant unique (ex: IP + route)
 * @param limit    Nombre de requêtes max dans la fenêtre
 * @param windowMs Durée de la fenêtre en millisecondes
 * @returns true si la requête est autorisée, false si bloquée
 */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.resetAt < now) {
        store.set(key, { count: 1, resetAt: now + windowMs });
        return true;
    }

    if (entry.count >= limit) return false;

    entry.count++;
    return true;
}
