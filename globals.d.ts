/**
 * globals.d.ts: ambient declarations.
 *
 * `import './global.css'` in app/_layout.tsx is a side-effect import that Metro
 * turns into styles. TypeScript has no idea what a .css file is and errors with
 * TS2882 ("cannot find module or type declarations for side-effect import")
 * unless we tell it the module exists.
 */
declare module '*.css';
