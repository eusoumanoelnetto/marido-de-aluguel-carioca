// Generic fallback declaration to avoid TS7016 in build environments where
// not all @types/* are installed. Prefer installing proper @types/* packages
// and remove this file when the build environment has the devDependencies.
declare module '*';
