import {type ClassValue, clsx} from "clsx"
import {twMerge} from "tailwind-merge"
import crypto from "crypto"

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
    authTag: string
}

export function encrypt(text: string, key: Buffer, iv: Buffer): EncryptedData {
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
    let encrypted = cipher.update(text, "utf8", "hex")
    encrypted += cipher.final("hex")
    const authTag = cipher.getAuthTag()

    return {
        encrypted,
        iv: iv.toString("hex"),
        authTag: authTag.toString("hex")
    }
}

export function decrypt(data: EncryptedData, key: Buffer) {
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(data.iv, "hex"))
    decipher.setAuthTag(Buffer.from(data.authTag, "hex"))

    let decrypted = decipher.update(data.encrypted, "hex", "utf8")
    decrypted += decipher.final("utf8")
    return decrypted
}

