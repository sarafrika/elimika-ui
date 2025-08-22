import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
// import crypto from "crypto"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getEnvironmentVariable(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Environment variable ${key} is not defined.`);
  return value;
}

/*export async function setAuthorizationHeader(headers: Headers) {
    const accessToken = await SessionUtils.getAccessToken(getEnvironmentVariable("NEXTAUTH_SECRET"))

    if (accessToken) {
        headers.set("Authorization", `Bearer ${accessToken}`)
    }
}*/

export type EncryptedData = {
  encrypted: string;
  iv: string;
  authTag: string;
};

export const profilePicSvg =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiB4bWw6c3BhY2U9InByZXNlcnZlIj48cGF0aCBmaWxsPSIjMjgyODI4IiBkPSJNMTM1LjgzMiAxNDAuODQ4aC03MC45Yy0yLjkgMC01LjYtMS42LTcuNC00LjUtMS40LTIuMy0xLjQtNS43IDAtOC42bDQtOC4yYzIuOC01LjYgOS43LTkuMSAxNC45LTkuNSAxLjctLjEgNS4xLS44IDguNS0xLjYgMi41LS42IDMuOS0xIDQuNy0xLjMtLjItLjctLjYtMS41LTEuMS0yLjItNi00LjctOS42LTEyLjYtOS42LTIxLjEgMC0xNCA5LjYtMjUuMyAyMS41LTI1LjNzMjEuNSAxMS40IDIxLjUgMjUuM2MwIDguNS0zLjYgMTYuNC05LjYgMjEuMS0uNS43LS45IDEuNC0xLjEgMi4xLjguMyAyLjIuNyA0LjYgMS4zIDMgLjcgNi42IDEuMyA4LjQgMS41IDUuMy41IDEyLjEgMy44IDE0LjkgOS40bDMuOSA3LjljMS41IDMgMS41IDYuOCAwIDkuMS0xLjYgMi45LTQuNCA0LjYtNy4yIDQuNnptLTM1LjQtNzguMmMtOS43IDAtMTcuNSA5LjYtMTcuNSAyMS4zIDAgNy40IDMuMSAxNC4xIDguMiAxOC4xLjEuMS4zLjIuNC40IDEuNCAxLjggMi4yIDMuOCAyLjIgNS45IDAgLjYtLjIgMS4yLS43IDEuNi0uNC4zLTEuNCAxLjItNy4yIDIuNi0yLjcuNi02LjggMS40LTkuMSAxLjYtNC4xLjQtOS42IDMuMi0xMS42IDcuM2wtMy45IDguMmMtLjggMS43LS45IDMuNy0uMiA0LjguOCAxLjMgMi4zIDIuNiA0IDIuNmg3MC45YzEuNyAwIDMuMi0xLjMgNC0yLjYuNi0xIC43LTMuNC0uMi01LjJsLTMuOS03LjljLTItNC03LjUtNi44LTExLjYtNy4yLTItLjItNS44LS44LTktMS42LTUuOC0xLjQtNi44LTIuMy03LjItMi41LS40LS40LS43LTEtLjctMS42IDAtMi4xLjgtNC4xIDIuMi01LjkuMS0uMS4yLS4zLjQtLjQgNS4xLTMuOSA4LjItMTAuNyA4LjItMTgtLjItMTEuOS04LTIxLjUtMTcuNy0yMS41eiIvPjwvc3ZnPg==';

// export function encrypt(text: string, key: Buffer, iv: Buffer): EncryptedData {
//   const cipher = crypto.createCipheriv("aes-256-gcm", key, iv)
//   let encrypted = cipher.update(text, "utf8", "hex")
//   encrypted += cipher.final("hex")
//   const authTag = cipher.getAuthTag()

//   return {
//     encrypted,
//     iv: iv.toString("hex"),
//     authTag: authTag.toString("hex"),
//   }
// }

// export function decrypt(data: EncryptedData, key: Buffer) {
//   const decipher = crypto.createDecipheriv(
//     "aes-256-gcm",
//     key,
//     Buffer.from(data.iv, "hex"),
//   )
//   decipher.setAuthTag(Buffer.from(data.authTag, "hex"))

//   let decrypted = decipher.update(data.encrypted, "hex", "utf8")
//   decrypted += decipher.final("utf8")
//   return decrypted
// }

export async function fileToBinaryString(file: File) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  return Array.from(bytes)
    .map(b => String.fromCharCode(b))
    .join('');
}

export const ELIMIKA_DASHBOARD_STORAGE_KEY = 'elimika-dashboard-view';
