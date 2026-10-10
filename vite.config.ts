import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Split the libraries that never change away from app code, so a
         * deploy only invalidates the app chunk instead of making every
         * returning student re-download React and Framer Motion.
         *
         * Only eagerly-imported packages are listed. exceljs, jspdf and
         * html2canvas are loaded with dynamic `import()` at the moment a
         * student clicks Export, so Rollup already gives them their own
         * lazy chunks — naming them here would pull them into the initial
         * download and undo that.
         */
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          // Match whole path segments: a loose `includes('react')` would
          // also swallow react-hot-toast and every other react-* package.
          if (/[\\/]node_modules[\\/](react|react-dom|react-router|react-router-dom|scheduler)[\\/]/.test(id)) {
            return 'react-vendor';
          }
          if (/[\\/]node_modules[\\/](framer-motion|motion-dom|motion-utils)[\\/]/.test(id)) {
            return 'motion';
          }
        },
      },
    },
    /**
     * Default is 500 kB, which only ever flagged exceljs (~939 kB). That
     * chunk is downloaded when a student clicks Export Excel and never on
     * page load, so the warning was pure noise — and noise hides the case
     * worth catching, an eager chunk quietly growing.
     *
     * The eager chunks are index (~190 kB), react-vendor (~160 kB) and
     * motion (~115 kB), so this ceiling leaves any of them room to grow
     * several times over before it fires. If it ever does fire for anything
     * other than exceljs, that is a real regression — do not raise it again.
     */
    chunkSizeWarningLimit: 1000,
  },
});
