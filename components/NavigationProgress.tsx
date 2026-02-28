'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';

/**
 * A slim animated progress bar at the top of the page that shows during route transitions.
 * Similar to YouTube/GitHub loading bar.
 */
export default function NavigationProgress() {
    const pathname = usePathname();
    const [isNavigating, setIsNavigating] = useState(false);
    const [progress, setProgress] = useState(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const prevPathRef = useRef(pathname);

    // When pathname changes, the navigation is complete
    useEffect(() => {
        if (prevPathRef.current !== pathname) {
            // Navigation completed
            setProgress(100);
            timeoutRef.current = setTimeout(() => {
                setIsNavigating(false);
                setProgress(0);
            }, 200);
            prevPathRef.current = pathname;
        }

        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, [pathname]);

    // Intercept clicks on links to start the progress bar
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const anchor = target.closest('a');
            if (!anchor) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('http') || href.startsWith('#') || href === pathname) return;

            // Start progress
            setIsNavigating(true);
            setProgress(20);

            // Animate progress
            if (intervalRef.current) clearInterval(intervalRef.current);
            let current = 20;
            intervalRef.current = setInterval(() => {
                current += Math.random() * 15;
                if (current >= 90) {
                    current = 90;
                    if (intervalRef.current) clearInterval(intervalRef.current);
                }
                setProgress(current);
            }, 200);
        };

        document.addEventListener('click', handleClick, true);
        return () => {
            document.removeEventListener('click', handleClick, true);
            if (intervalRef.current) clearInterval(intervalRef.current);
        };
    }, [pathname]);

    if (!isNavigating) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[9999] h-[3px]">
            <div
                className="h-full bg-gradient-to-r from-purple-500 via-purple-600 to-indigo-500 transition-all duration-200 ease-out shadow-lg shadow-purple-500/20"
                style={{ width: `${progress}%` }}
            />
        </div>
    );
}
