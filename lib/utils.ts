import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getEnvironmentVariable(key: string): string {
  const value = process.env[key]
  if (!value) throw new Error(`Environment variable ${key} is not defined.`)
  return value
}

/*export async function setAuthorizationHeader(headers: Headers) {
    const accessToken = await SessionUtils.getAccessToken(getEnvironmentVariable("NEXTAUTH_SECRET"))

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`)
    }
}*/

export type EncryptedData = {
  encrypted: string
  iv: string
}

export async function encrypt(
  text: string,
  key: string,
): Promise<EncryptedData> {
  // Convert the key to a proper format
  const keyBuffer = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt"],
  )

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12))

  // Encrypt the data
  const encodedText = new TextEncoder().encode(text)
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    keyBuffer,
    encodedText,
  )

  // Convert to base64 for storage/transmission
  const encrypted = btoa(
    String.fromCharCode(...new Uint8Array(encryptedBuffer)),
  )
  const ivString = btoa(String.fromCharCode(...iv))

  return {
    encrypted,
    iv: ivString,
  }
}

export async function decrypt(
  data: EncryptedData,
  key: string,
): Promise<string> {
  // Convert the key to a proper format
  const keyBuffer = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(key),
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"],
  )

  // Convert base64 back to buffers
  const encryptedData = Uint8Array.from(atob(data.encrypted), (c) =>
    c.charCodeAt(0),
  )
  const iv = Uint8Array.from(atob(data.iv), (c) => c.charCodeAt(0))

  // Decrypt the data
  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    keyBuffer,
    encryptedData,
  )

  return new TextDecoder().decode(decryptedBuffer)
}
