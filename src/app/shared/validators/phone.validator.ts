import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/** Characters permitted in a phone number: digits, spaces, and common separators. */
const ALLOWED_CHARS = /^[+\d\s().-]+$/;
const MIN_DIGITS = 7;
const MAX_DIGITS = 15;

/**
 * Validates phone numbers leniently across international and local formats.
 * Accepts an optional single leading `+`, digits, spaces, hyphens, dots and
 * parentheses, requiring 7–15 digits overall. Empty values pass — combine with
 * `Validators.required` when the field is mandatory.
 */
export function phoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value = (control.value ?? '').toString().trim();
    if (value === '') {
      return null;
    }

    if (!ALLOWED_CHARS.test(value)) {
      return { phone: true };
    }

    // A '+' is only valid as a single leading character.
    const plusCount = (value.match(/\+/g) ?? []).length;
    if (plusCount > 1 || (plusCount === 1 && !value.startsWith('+'))) {
      return { phone: true };
    }

    const digitCount = value.replace(/\D/g, '').length;
    if (digitCount < MIN_DIGITS || digitCount > MAX_DIGITS) {
      return { phone: true };
    }

    return null;
  };
}
