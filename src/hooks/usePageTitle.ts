import { useEffect } from "react";

/**
 * Set the document title when a page mounts, and restore the default on unmount.
 */
export function usePageTitle(title: string): void {
    useEffect(() => {
        const prev = document.title;
        document.title = `${title} — Student Dashboard`;
        return () => {
            document.title = prev;
        };
    }, [title]);
}
