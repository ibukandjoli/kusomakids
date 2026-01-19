'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { useEffect, useState } from 'react';

export default function MetaPixel() {
    const [loaded, setLoaded] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        if (!loaded) return;
        import('react-facebook-pixel')
            .then((x) => x.default)
            .then((ReactPixel) => {
                ReactPixel.init(process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID);
                ReactPixel.pageView();
            });
    }, [pathname, loaded]);

    return (
        <>
            <Script
                id="fb-pixel"
                src="https://connect.facebook.net/en_US/fbevents.js"
                strategy="afterInteractive"
                onLoad={() => setLoaded(true)}
                data-pixel-id={process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID}
            />
        </>
    );
}
