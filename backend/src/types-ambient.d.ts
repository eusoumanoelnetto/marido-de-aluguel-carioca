// Ambient module declarations to quiet third-party packages without @types
declare module 'web-push' {
  const webpush: any;
  export default webpush;
}

// fallback for other modules if needed
declare module 'some-untyped-module';
