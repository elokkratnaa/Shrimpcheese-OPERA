/**
 * Sanitizes API error messages to prevent sensitive information (like API keys)
 * from being displayed in the UI.
 */
export function sanitizeApiError(error: any): string {
  const message = error instanceof Error ? error.message : String(error);

  // If the error contains potentially sensitive information or is low-level,
  // return a generic, user-friendly message.
  if (
    message.toLowerCase().includes("api key") ||
    message.toLowerCase().includes("supabase") ||
    message.toLowerCase().includes("connection") ||
    message.toLowerCase().includes("unauthorized")
  ) {
    return "An unexpected error occurred. Please try again later.";
  }

  return message;
}
