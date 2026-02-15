/**
 * Session-scoped AES-GCM encryption for sensitive data stored in sessionStorage.
 *
 * The encryption key lives only in memory (a module-level closure) and is never
 * persisted. This means:
 * - A page refresh generates a new key (old ciphertext becomes unreadable).
 * - The password cannot be recovered by reading sessionStorage alone.
 * - Casual browser-extension snooping sees only ciphertext + IV.
 *
 * Trade-offs accepted: this is NOT a substitute for server-side session tokens.
 * It mitigates the lowest-hanging-fruit attack vector (plaintext in storage).
 */

const ALGO = "AES-GCM";
const KEY_LENGTH = 256;

let _key: CryptoKey | null = null;

/** Lazily generate (or return cached) per-session encryption key. */
async function getKey(): Promise<CryptoKey> {
    if (_key) return _key;
    _key = await crypto.subtle.generateKey(
        { name: ALGO, length: KEY_LENGTH },
        false, // not extractable
        ["encrypt", "decrypt"],
    );
    return _key;
}

/** Encrypt plaintext → base64-encoded ciphertext + IV. */
export async function encryptForSession(
    plaintext: string,
): Promise<{ ciphertext: string; iv: string }> {
    const key = await getKey();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(plaintext);

    const cipherBuf = await crypto.subtle.encrypt(
        { name: ALGO, iv },
        key,
        encoded,
    );

    return {
        ciphertext: bufToBase64(new Uint8Array(cipherBuf)),
        iv: bufToBase64(iv),
    };
}

/** Decrypt base64-encoded ciphertext + IV → plaintext. */
export async function decryptFromSession(
    ciphertext: string,
    iv: string,
): Promise<string> {
    const key = await getKey();
    const cipherBuf = base64ToBuf(ciphertext);
    const ivBuf = base64ToBuf(iv);

    const plainBuf = await crypto.subtle.decrypt(
        { name: ALGO, iv: ivBuf as BufferSource },
        key,
        cipherBuf as BufferSource,
    );

    return new TextDecoder().decode(plainBuf);
}

/** Reset the in-memory key (call on sign-out). */
export function clearSessionKey(): void {
    _key = null;
}

// --- helpers ---
function bufToBase64(buf: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < buf.length; i++) binary += String.fromCharCode(buf[i]);
    return btoa(binary);
}

function base64ToBuf(b64: string): Uint8Array {
    const binary = atob(b64);
    const buf = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
    return buf;
}
