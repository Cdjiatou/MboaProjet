import { formatPhoneNumber, extractDigits, arePhoneNumbersEqual } from './phoneFormatter';

describe('phoneFormatter', () => {
  describe('formatPhoneNumber', () => {
    it('devrait formater un numéro local camerounais (9 chiffres commençant par 6)', () => {
      expect(formatPhoneNumber('691234567')).toBe('+237691234567');
      expect(formatPhoneNumber('677123456')).toBe('+237677123456');
      expect(formatPhoneNumber('650123456')).toBe('+237650123456');
    });

    it('devrait formater un numéro local avec espaces', () => {
      expect(formatPhoneNumber('6 91 23 45 67')).toBe('+237691234567');
      expect(formatPhoneNumber('6 77 12 34 56')).toBe('+237677123456');
    });

    it('devrait conserver un numéro déjà formaté avec +237', () => {
      expect(formatPhoneNumber('+237691234567')).toBe('+237691234567');
      expect(formatPhoneNumber('+237 691 234 567')).toBe('+237691234567');
    });

    it('devrait formater un numéro avec 237 sans le +', () => {
      expect(formatPhoneNumber('237691234567')).toBe('+237691234567');
      expect(formatPhoneNumber('237 691 234 567')).toBe('+237691234567');
    });

    it('devrait conserver les numéros internationaux d\'autres pays', () => {
      expect(formatPhoneNumber('+33612345678')).toBe('+33612345678');
      expect(formatPhoneNumber('+1234567890')).toBe('+1234567890');
      expect(formatPhoneNumber('+44123456789')).toBe('+44123456789');
    });

    it('devrait gérer les numéros avec tirets et parenthèses', () => {
      expect(formatPhoneNumber('(691) 234-567')).toBe('+237691234567');
      expect(formatPhoneNumber('+237 (691) 234-567')).toBe('+237691234567');
    });

    it('devrait gérer les numéros sans indicatif mais avec +', () => {
      expect(formatPhoneNumber('+691234567')).toBe('+691234567');
    });

    it('devrait retourner le numéro vide si aucun chiffre', () => {
      expect(formatPhoneNumber('')).toBe('');
      expect(formatPhoneNumber('   ')).toBe('');
    });

    it('ne devrait pas ajouter +237 aux numéros de moins de 9 chiffres', () => {
      expect(formatPhoneNumber('6912345')).toBe('+6912345'); // 7 chiffres
      expect(formatPhoneNumber('69123456')).toBe('+69123456'); // 8 chiffres
    });

    it('ne devrait pas ajouter +237 aux numéros de plus de 9 chiffres ne commençant pas par 237', () => {
      expect(formatPhoneNumber('6912345678')).toBe('+6912345678'); // 10 chiffres
    });

    it('ne devrait pas ajouter +237 aux numéros de 9 chiffres ne commençant pas par 6', () => {
      expect(formatPhoneNumber('791234567')).toBe('+791234567');
      expect(formatPhoneNumber('891234567')).toBe('+891234567');
    });
  });

  describe('extractDigits', () => {
    it('devrait extraire uniquement les chiffres', () => {
      expect(extractDigits('+237691234567')).toBe('237691234567');
      expect(extractDigits('6 91 23 45 67')).toBe('691234567');
      expect(extractDigits('+237 (691) 234-567')).toBe('237691234567');
    });

    it('devrait retourner une chaîne vide si pas de chiffres', () => {
      expect(extractDigits('')).toBe('');
      expect(extractDigits('abc')).toBe('');
      expect(extractDigits('---')).toBe('');
    });
  });

  describe('arePhoneNumbersEqual', () => {
    it('devrait considérer deux numéros identiques malgré le formatage', () => {
      expect(arePhoneNumbersEqual('+237691234567', '237691234567')).toBe(true);
      expect(arePhoneNumbersEqual('691234567', '+237691234567')).toBe(false); // Différent car pas de 237
      expect(arePhoneNumbersEqual('+237 691 234 567', '+237691234567')).toBe(true);
    });

    it('devrait détecter des numéros différents', () => {
      expect(arePhoneNumbersEqual('+237691234567', '+237677123456')).toBe(false);
      expect(arePhoneNumbersEqual('691234567', '677123456')).toBe(false);
    });
  });
});
