export type SharePlatform = 'facebook' | 'twitter' | 'linkedin' | 'whatsapp' | 'email';

export type ShareTarget = {
  description?: string;
  title?: string;
  url: string;
};

export function buildSocialShareUrl(
  platform: SharePlatform,
  { description, title, url }: ShareTarget
) {
  const encodedUrl = encodeURIComponent(url);
  const resolvedTitle = title?.trim() || 'Shared link';
  const encodedTitle = encodeURIComponent(resolvedTitle);
  const encodedDescription = encodeURIComponent(description?.trim() || resolvedTitle);

  const urls: Record<SharePlatform, string> = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodedDescription}&url=${encodedUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedDescription}%0A${encodedUrl}`,
    email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A${encodedUrl}`,
  };

  return urls[platform];
}

export function openShareWindow(url: string) {
  if (typeof window === 'undefined') return;

  window.open(url, '_blank', 'noopener,noreferrer,width=600,height=400');
}
