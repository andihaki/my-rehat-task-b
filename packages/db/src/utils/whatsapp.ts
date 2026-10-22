export function normalizeMyWhatsapp(input: string): string | null {
  // Strip spaces, -, (, ), and +
  let normalized = input.replace(/[\s\-\(\)\+]/g, "");

  // If it starts with 0, replace the leading 0 with 60
  if (normalized.startsWith("0")) {
    normalized = "60" + normalized.slice(1);
  }

  // If it already starts with 60, keep it (no change needed)

  // Return null if the result is not all digits or total length is not 11 to 12 digits
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  if (normalized.length < 11 || normalized.length > 12) {
    return null;
  }

  return normalized;
}
