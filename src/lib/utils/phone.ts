export const GHANA_COUNTRY_CODE = '+233';
export const PHONE_REGEX = /^(\+233|233|0)?[2-5][0-9]{8}$/;

export function normalizePhoneInput(input: string): string {
  const digitsOnly = input.replace(/\D/g, '');
  if (!digitsOnly) {
    return '';
  }

  let localDigits = digitsOnly;

  if (digitsOnly.startsWith('233')) {
    localDigits = digitsOnly.slice(3);
  } else if (digitsOnly.startsWith('0')) {
    localDigits = digitsOnly.slice(1);
  }

  return `${GHANA_COUNTRY_CODE}${localDigits.slice(0, 9)}`;
}

export function validateGhanaPhone(phone: string): boolean {
  const trimmed = phone.trim();
  return PHONE_REGEX.test(trimmed) || PHONE_REGEX.test(normalizePhoneInput(trimmed));
}

export function formatPhoneNumber(phone: string): string {
  return normalizePhoneInput(phone);
}
