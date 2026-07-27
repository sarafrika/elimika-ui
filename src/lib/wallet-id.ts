// Public Skills Wallet ID.
//
// Format: ELM-{COUNTRY}-{YEAR}-{RANDOM}-{CHECK}
//
// The ID is derived deterministically from a stable seed (the learner's
// internal ID). That guarantees the same public wallet number when a learner:
//   - transfers to another institution
//   - changes courses
//   - becomes an adult
//   - changes their name or contact details
//   - receives funding from another sponsor
//   - enrols in several institutions at once
//
// It does NOT encode personal information, so the wallet ID can safely be
// shared with sponsors, employers, credentialing bodies and payment rails.
//
// Institutions may still keep their own local reference number for the
// learner (institutionRef helper below) — those live alongside, they do
// not replace the wallet ID.

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/1/I/O ambiguity

function hash32(input: string): number {
  // Small deterministic FNV-1a; fine for display IDs (not a security hash).
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

function encodeBlock(n: number, len: number): string {
  let out = "";
  let x = n;
  for (let i = 0; i < len; i++) {
    out = ALPHABET[x % ALPHABET.length] + out;
    x = Math.floor(x / ALPHABET.length);
  }
  return out;
}

function checkDigit(body: string): string {
  // Simple mod-check over the ALPHABET; single character.
  let sum = 0;
  for (let i = 0; i < body.length; i++) {
    const idx = ALPHABET.indexOf(body[i].toUpperCase());
    sum += (idx >= 0 ? idx : body.charCodeAt(i)) * (i + 1);
  }
  return ALPHABET[sum % ALPHABET.length];
}

export type WalletIdOptions = {
  /** ISO country code (default KE — matches the KSh currency used across the app). */
  country?: string;
  /** Year the wallet was first issued (defaults to 2024 so IDs are stable across renders). */
  year?: number;
};

/**
 * Generate the public Skills Wallet ID for a learner. `seed` must be a
 * stable value tied to the learner (their internal ID), NOT their name or
 * email — those can change.
 */
export function generateWalletId(seed: string | number, opts: WalletIdOptions = {}): string {
  const country = (opts.country ?? "KE").toUpperCase().slice(0, 3);
  const year = opts.year ?? 2024;
  const random = encodeBlock(hash32(`elm:${country}:${year}:${seed}`), 6);
  const body = `ELM-${country}-${year}-${random}`;
  return `${body}-${checkDigit(body)}`;
}

/**
 * Optional institution-local reference number. Institutions often need a
 * shorter local ID (admission number, roll number). This stays alongside
 * the wallet ID — it does not replace it.
 */
export function institutionRef(institutionCode: string, seed: string | number): string {
  const suffix = encodeBlock(hash32(`${institutionCode}:${seed}`), 4);
  return `${institutionCode.toUpperCase()}-${suffix}`;
}
