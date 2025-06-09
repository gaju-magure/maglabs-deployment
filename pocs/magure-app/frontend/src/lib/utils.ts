import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getBaseUrl() {
  const [subdomain, domain, _] = window.location.hostname.split('.')
  return `http://${subdomain}.${domain}.api`
}