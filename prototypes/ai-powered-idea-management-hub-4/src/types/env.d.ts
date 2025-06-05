// Type declarations for global window ENV
interface Window {
  ENV?: {
    [key: string]: string;
  };
}

// Type declarations for import.meta.env
interface ImportMeta {
  env: {
    [key: string]: string;
  };
}
