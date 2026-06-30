// =============================================================================
// PAGE CONTACT — Interface de contact direct MBOA NEXT STAR (Inspirée du design de référence)
// =============================================================================

import { motion } from 'framer-motion';
import { MapPin, ArrowUpRight } from 'lucide-react';
import { useThemeStore } from '@/store/useThemeStore';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: [0.4, 0, 0.2, 1] as any },
  }),
};

const Contact = () => {
  const assets = useThemeStore((state) => state.assets);

  const phoneValue = assets.contact_phone || '677 103 475 / 698 900 627';
  const emailValue = assets.contact_email || 'contact@mboanextstar.com';
  const addressValue = assets.contact_address || "Cinéma L'Éden, Bessengue\nDouala, Cameroun";

  const contactLinks = [
    {
      name: 'WhatsApp',
      value: assets.whatsapp_name || (assets.whatsapp_url ? assets.whatsapp_url.replace('https://wa.me/', '').replace('https://api.whatsapp.com/send?phone=', '') : '677 103 475'),
      href: assets.whatsapp_url || 'https://wa.me/237677103475',
      iconColor: 'text-[#25D366]',
      iconBg: 'bg-[#25D366]/10',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.888-.788-1.487-1.761-1.659-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/>
        </svg>
      )
    },
    {
      name: 'Facebook',
      value: assets.facebook_name || (assets.facebook_url && assets.facebook_url !== 'https://facebook.com' && assets.facebook_url !== '#' ? assets.facebook_url.replace(/^https?:\/\/(www\.)?facebook\.com\/?/, '') : 'Mood & Com'),
      href: assets.facebook_url || 'https://facebook.com',
      iconColor: 'text-[#1877F2]',
      iconBg: 'bg-[#1877F2]/10',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      )
    },
    {
      name: 'Instagram',
      value: assets.instagram_name || (assets.instagram_url && assets.instagram_url !== 'https://instagram.com' && assets.instagram_url !== '#' ? (assets.instagram_url.startsWith('@') ? assets.instagram_url : '@' + assets.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\/?/, '').replace(/\//g, '')) : '@mboanextstar'),
      href: assets.instagram_url ? (assets.instagram_url.startsWith('http') ? assets.instagram_url : `https://instagram.com/${assets.instagram_url.replace('@', '')}`) : 'https://instagram.com/mboanextstar',
      iconColor: 'text-[#E4405F]',
      iconBg: 'bg-[#E4405F]/10',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
        </svg>
      )
    },
    {
      name: 'YouTube',
      value: assets.youtube_name || (assets.youtube_channel && assets.youtube_channel !== 'https://youtube.com' && assets.youtube_channel !== '#' ? assets.youtube_channel.replace(/^https?:\/\/(www\.)?youtube\.com\/?/, '') : 'Mboa Next Star'),
      href: assets.youtube_channel || 'https://youtube.com',
      iconColor: 'text-[#FF0000]',
      iconBg: 'bg-[#FF0000]/10',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      )
    },
    {
      name: 'Email',
      value: emailValue,
      href: `mailto:${emailValue}`,
      iconColor: 'text-[#F4B400]',
      iconBg: 'bg-[#F4B400]/10',
      svg: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 12.713l11.985-8.71c-.096-.402-.276-.776-.525-1.096A2 2 0 0 0 21.844 2H2.156A2 2 0 0 0 .54 2.907c-.249.32-.429.694-.525 1.096L12 12.713zm11.97 1.02L15.11 7.29 24 1.25v12.483zM0 13.733l8.89-6.443L0 1.25v12.483zm12 1.34L.493 16.71a1.996 1.996 0 0 0 1.663.903h19.688a1.996 1.996 0 0 0 1.663-.903L12 15.073z"/>
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 bg-[#050505] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_center,rgba(212,175,55,0.03)_0%,transparent_50%)] pointer-events-none" />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 relative z-10">
        
        {/* ── ADRESSE HEADER ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-5 mb-10"
        >
          <div className="w-14 h-14 rounded-full border border-white/10 bg-[#0b0b0b] flex items-center justify-center shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.02)]">
            <MapPin className="w-6 h-6 text-neutral-400" />
          </div>
          <div>
            <h2 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5">
              Adresse
            </h2>
            <p className="text-white text-sm sm:text-base font-medium leading-relaxed whitespace-pre-line">
              {addressValue}
            </p>
          </div>
        </motion.div>

        {/* Ligne de séparation subtile */}
        <motion.div 
          initial={{ opacity: 0, scaleX: 0 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full h-px bg-gradient-to-r from-[#0b0b0b] via-white/10 to-[#0b0b0b] mb-10 origin-left"
        />

        {/* ── LISTE DES CARTES DE CONTACT ── */}
        <div className="flex flex-col gap-4">
          {contactLinks.map((link, i) => {
            return (
              <motion.a
                key={link.name}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                className="group relative flex items-center justify-between p-5 sm:p-6 bg-[#0b0b0b]/80 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20 hover:bg-[#111111]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="flex items-center gap-5 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${link.iconBg}`}>
                    <div className={link.iconColor}>
                      {link.svg}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1">
                      {link.name}
                    </h3>
                    <p className="text-white font-bold text-sm sm:text-base group-hover:text-[#d4af37] transition-colors">
                      {link.value}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 group-hover:text-white transition-colors">
                  <ArrowUpRight className="w-5 h-5 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform duration-300" />
                </div>
              </motion.a>
            );
          })}
        </div>
        
        {/* Support Téléphone direct sous les liens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-neutral-500 text-xs uppercase tracking-widest">
            Support Téléphone direct : <span className="text-white font-bold">{phoneValue}</span>
          </p>
        </motion.div>
        
      </div>
    </div>
  );
};

export default Contact;
