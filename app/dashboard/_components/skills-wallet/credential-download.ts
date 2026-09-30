import { toAuthenticatedMediaUrl } from '@/src/lib/media-url';
import type { CredentialRecord } from '@/app/dashboard/student/skills-wallet/_components/SkillsWalletShared';

export async function downloadCredential(credential: CredentialRecord, ownerName: string) {
  const url = toAuthenticatedMediaUrl(credential.document_url);
  if (!url) {
    const { exportCredentialsPdf } = await import(
      '@/app/dashboard/student/skills-wallet/credentials-pdf'
    );
    exportCredentialsPdf({
      studentName: ownerName,
      credentials: [credential],
      verifications: [],
      filename: credential.name,
    });
    return;
  }

  // Download the binary through the authenticated media proxy, not the API host.
  const response = await fetch(url);
  if (!response.ok) throw new Error('Unable to download this credential. Please try again.');
  const blob = await response.blob();
  const extension =
    (
      {
        'application/pdf': '.pdf',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      } as Record<string, string>
    )[blob.type] ?? '';
  const name = credential.filename || credential.name;
  const safeName = name.replace(/[<>:"/\\|?*\u0000-\u001f]/g, '-').trim() || 'credential';
  const filename = /\.[a-z0-9]{2,5}$/i.test(safeName) ? safeName : `${safeName}${extension}`;
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}
