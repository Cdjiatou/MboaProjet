import React, { useState, useEffect } from 'react';
import { Smartphone } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export interface Operator {
  id: string;
  name: string;
  color: string;
  pattern: RegExp;
  logoUrl?: string; // Optional if we have logos, else we use name and color
}

export const OPERATORS: Operator[] = [
  {
    id: 'orange',
    name: 'Orange',
    color: '#ff6600',
    pattern: /^(?:\+237)?(?:69|655|656|657|658|659)/,
    logoUrl: '/images/payments/orange-money.svg',
  },
  {
    id: 'mtn',
    name: 'MTN',
    color: '#ffcc00',
    pattern: /^(?:\+237)?(?:67|650|651|652|653|654|68)/,
    logoUrl: '/images/payments/mtn-momo.svg',
  },
  {
    id: 'nexttel',
    name: 'Nexttel',
    color: '#e30613',
    pattern: /^(?:\+237)?(?:66)/,
  },
  {
    id: 'camtel',
    name: 'Camtel',
    color: '#00a0e9',
    pattern: /^(?:\+237)?(?:620|242|243)/,
  }
];

interface PhoneInputProps {
  value: string;
  onChange: (val: string) => void;
  required?: boolean;
  className?: string;
  disabled?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value = '',
  onChange,
  required = false,
  className = '',
  disabled = false,
}) => {
  const [detectedOperator, setDetectedOperator] = useState<Operator | null>(null);

  useEffect(() => {
    // Nettoyer la valeur (garder chiffres et +)
    const cleanValue = value.replace(/[^\d+]/g, '');
    
    // Détection
    const found = OPERATORS.find(op => op.pattern.test(cleanValue));
    setDetectedOperator(found || null);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // On autorise la saisie libre, mais on peut faire un formatage léger si on le souhaite.
    // L'utilisateur tape librement son numéro.
    onChange(e.target.value);
  };

  return (
    <div className={`relative flex items-center w-full ${className}`}>
      <div className="absolute left-4 text-neutral-500">
        <Smartphone className="w-5 h-5" />
      </div>
      
      <input
        required={required}
        disabled={disabled}
        type="tel"
        value={value}
        onChange={handleChange}
        placeholder="Entrez votre numéro (ex: 694 56 78 90)"
        className={`
          w-full bg-[#050505] border border-white/[0.08] rounded-xl pl-12 pr-28 py-3.5
          text-white text-base placeholder:text-neutral-600 focus:outline-none transition-all
          focus:border-[#d4af37]/40 focus:bg-white/[0.03]
          ${disabled ? 'opacity-55 cursor-not-allowed' : ''}
        `}
      />

      {/* Affichage de l'opérateur détecté de manière fluide */}
      <AnimatePresence>
        {detectedOperator && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="absolute right-3 flex items-center gap-2 pointer-events-none"
          >
            {detectedOperator.logoUrl ? (
              <div className="px-2 py-1 bg-white rounded-md border border-white/10 shadow-lg flex items-center justify-center">
                <img 
                  src={detectedOperator.logoUrl} 
                  alt={detectedOperator.name} 
                  className="h-5 w-auto object-contain"
                />
              </div>
            ) : (
              <div 
                className="px-2.5 py-1 rounded-md border shadow-lg flex items-center gap-1.5"
                style={{ 
                  backgroundColor: `${detectedOperator.color}15`, 
                  borderColor: `${detectedOperator.color}40` 
                }}
              >
                <div 
                  className="w-1.5 h-1.5 rounded-full" 
                  style={{ backgroundColor: detectedOperator.color }} 
                />
                <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                  {detectedOperator.name}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

