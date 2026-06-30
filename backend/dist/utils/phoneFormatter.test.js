"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const phoneFormatter_1 = require("./phoneFormatter");
describe('phoneFormatter', () => {
    describe('formatPhoneNumber', () => {
        it('devrait formater un numéro local camerounais (9 chiffres commençant par 6)', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('691234567')).toBe('+237691234567');
            expect((0, phoneFormatter_1.formatPhoneNumber)('677123456')).toBe('+237677123456');
            expect((0, phoneFormatter_1.formatPhoneNumber)('650123456')).toBe('+237650123456');
        });
        it('devrait formater un numéro local avec espaces', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('6 91 23 45 67')).toBe('+237691234567');
            expect((0, phoneFormatter_1.formatPhoneNumber)('6 77 12 34 56')).toBe('+237677123456');
        });
        it('devrait conserver un numéro déjà formaté avec +237', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('+237691234567')).toBe('+237691234567');
            expect((0, phoneFormatter_1.formatPhoneNumber)('+237 691 234 567')).toBe('+237691234567');
        });
        it('devrait formater un numéro avec 237 sans le +', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('237691234567')).toBe('+237691234567');
            expect((0, phoneFormatter_1.formatPhoneNumber)('237 691 234 567')).toBe('+237691234567');
        });
        it('devrait conserver les numéros internationaux d\'autres pays', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('+33612345678')).toBe('+33612345678');
            expect((0, phoneFormatter_1.formatPhoneNumber)('+1234567890')).toBe('+1234567890');
            expect((0, phoneFormatter_1.formatPhoneNumber)('+44123456789')).toBe('+44123456789');
        });
        it('devrait gérer les numéros avec tirets et parenthèses', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('(691) 234-567')).toBe('+237691234567');
            expect((0, phoneFormatter_1.formatPhoneNumber)('+237 (691) 234-567')).toBe('+237691234567');
        });
        it('devrait gérer les numéros sans indicatif mais avec +', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('+691234567')).toBe('+691234567');
        });
        it('devrait retourner le numéro vide si aucun chiffre', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('')).toBe('');
            expect((0, phoneFormatter_1.formatPhoneNumber)('   ')).toBe('');
        });
        it('ne devrait pas ajouter +237 aux numéros de moins de 9 chiffres', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('6912345')).toBe('+6912345'); // 7 chiffres
            expect((0, phoneFormatter_1.formatPhoneNumber)('69123456')).toBe('+69123456'); // 8 chiffres
        });
        it('ne devrait pas ajouter +237 aux numéros de plus de 9 chiffres ne commençant pas par 237', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('6912345678')).toBe('+6912345678'); // 10 chiffres
        });
        it('ne devrait pas ajouter +237 aux numéros de 9 chiffres ne commençant pas par 6', () => {
            expect((0, phoneFormatter_1.formatPhoneNumber)('791234567')).toBe('+791234567');
            expect((0, phoneFormatter_1.formatPhoneNumber)('891234567')).toBe('+891234567');
        });
    });
    describe('extractDigits', () => {
        it('devrait extraire uniquement les chiffres', () => {
            expect((0, phoneFormatter_1.extractDigits)('+237691234567')).toBe('237691234567');
            expect((0, phoneFormatter_1.extractDigits)('6 91 23 45 67')).toBe('691234567');
            expect((0, phoneFormatter_1.extractDigits)('+237 (691) 234-567')).toBe('237691234567');
        });
        it('devrait retourner une chaîne vide si pas de chiffres', () => {
            expect((0, phoneFormatter_1.extractDigits)('')).toBe('');
            expect((0, phoneFormatter_1.extractDigits)('abc')).toBe('');
            expect((0, phoneFormatter_1.extractDigits)('---')).toBe('');
        });
    });
    describe('arePhoneNumbersEqual', () => {
        it('devrait considérer deux numéros identiques malgré le formatage', () => {
            expect((0, phoneFormatter_1.arePhoneNumbersEqual)('+237691234567', '237691234567')).toBe(true);
            expect((0, phoneFormatter_1.arePhoneNumbersEqual)('691234567', '+237691234567')).toBe(false); // Différent car pas de 237
            expect((0, phoneFormatter_1.arePhoneNumbersEqual)('+237 691 234 567', '+237691234567')).toBe(true);
        });
        it('devrait détecter des numéros différents', () => {
            expect((0, phoneFormatter_1.arePhoneNumbersEqual)('+237691234567', '+237677123456')).toBe(false);
            expect((0, phoneFormatter_1.arePhoneNumbersEqual)('691234567', '677123456')).toBe(false);
        });
    });
});
