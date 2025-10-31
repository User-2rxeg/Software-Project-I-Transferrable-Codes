export function normalizeBearerToken(raw?: string | null): string | null {
    if (!raw) return null;
    const m = raw.match(/^\s*Bearer\s+(.+)$/i);
    return m ? m[1] : raw.trim();
}
