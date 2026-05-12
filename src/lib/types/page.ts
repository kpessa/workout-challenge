// SvelteKit page types
export interface FormData {
  success?: boolean;
  error?: string;
  message?: string;
  [key: string]: unknown;
}