import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

export default function useSecureImageUrl(secureUrl: string | null) {
    const session = useSession();
    const [imageUrl, setImageUrl] = useState<string | null>();
    useEffect(() => {
        if (secureUrl && session.data) {
        }
    }, [session]);

    return imageUrl;
}
