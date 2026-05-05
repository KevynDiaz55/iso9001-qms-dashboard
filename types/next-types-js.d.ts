declare module 'next/types.js' {
  export * from 'next/types';

  // Fallbacks for metadata helper types used by Next.js' generated validator
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

declare module 'next' {
  // Ensure these names exist on the main 'next' module as well
  export type ResolvingMetadata = any;
  export type ResolvingViewport = any;
}

