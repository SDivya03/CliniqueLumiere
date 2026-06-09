import { FormControl } from '@angular/forms';

import { phoneValidator } from './phone.validator';

describe('phoneValidator', () => {
  const validate = (value: string) => phoneValidator()(new FormControl(value));

  it('passes for an empty value (field is optional)', () => {
    expect(validate('')).toBeNull();
    expect(validate('   ')).toBeNull();
  });

  it('accepts valid international and local formats', () => {
    expect(validate('+33 6 12 34 56 78')).toBeNull();
    expect(validate('06 12 34 56 78')).toBeNull();
    expect(validate('(020) 123-4567')).toBeNull();
    expect(validate('+31201234567')).toBeNull();
  });

  it('rejects numbers with too few digits', () => {
    expect(validate('12345')).toEqual({ phone: true });
  });

  it('rejects numbers with too many digits', () => {
    expect(validate('1234567890123456')).toEqual({ phone: true });
  });

  it('rejects values containing letters', () => {
    expect(validate('call-me-now')).toEqual({ phone: true });
  });
});
