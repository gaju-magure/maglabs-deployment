import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  // For development with specific tenant domain setup
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // Use the known tenant domain for API calls
    return 'http://magureinc.maglabs.api:8000'
  }
  
  const [subdomain, domain, _] = window.location.hostname.split('.')
  return `http://${subdomain}.${domain}.api:8000`
}