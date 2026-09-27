import { z } from 'zod';
import { getLocale, validationMessages } from './i18n';

z.config({
  customError: (iss) => {
    const t = validationMessages[getLocale()];
    switch (iss.code) {
      case 'too_small':
        if (iss.origin === 'array') return t.minPhotos(Number(iss.minimum));
        return Number(iss.minimum) <= 1 ? t.required : t.minChars(Number(iss.minimum));
      case 'too_big':
        if (iss.origin === 'array') return t.maxPhotos(Number(iss.maximum));
        return t.maxChars(Number(iss.maximum));
      case 'invalid_format':
        return iss.format === 'email' ? t.invalidEmail : t.invalidChars;
      default:
        return undefined;
    }
  },
});
