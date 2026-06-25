// =============================================================================
// PAGE CONTACT — Formulaire de contact premium MBOA NEXT STAR
// =============================================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  Phone,
  MapPin,
  Send,
  CheckCircle,
  Clock,
  MessageSquare,
  User,
  Star,
} from 'lucide-react';

const contactInfos = [
  {
    icon: Mail,
    label: 'Email',
    value: 'contact@mboanextstar.com',
    href: 'mailto:contact@mboanextstar.com',
  },
  {
    icon: Phone,
    label: 'Téléphone',
    value: '+237 677 103 475 / 698 900 627',
    href: 'tel:+237677103475',
  },
  {
    icon: MapPin,
    label: 'Adresse',
    value: 'Cinéma L\'Éden, Douala, Cameroun',
    href: null,
  },
  {
    icon: Clock,
    label: 'Horaires',
    value: 'Lun – Ven : 9h00 – 18h00',
    href: null,
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay: i * 0.1 },
  }),
};

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Simule un envoi (à brancher sur l'API backend)
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSending(false);
    setSubmitted(true);
  };

  // ─── ÉCRAN DE CONFIRMATION ─────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-[#d4af37]/20 shadow-[0_0_60px_rgba(212,175,55,0.1)] rounded-3xl p-10 text-center max-w-md w-full"
        >
          <div className="w-16 h-16 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#d4af37] to-[#b8952e] flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-black" />
          </div>
          <h2 className="text-2xl font-black text-white mb-3 uppercase tracking-wider">
            Message envoyé !
          </h2>
          <p className="text-neutral-400 text-sm leading-relaxed">
            Merci pour votre message. Notre équipe vous répondra dans les
            meilleurs délais. Restez connecté !
          </p>
          <button
            onClick={() => {
              setSubmitted(false);
              setFormData({ name: '', email: '', subject: '', message: '' });
            }}
            className="mt-6 px-6 py-3 rounded-xl border border-[#d4af37]/30 text-[#d4af37] text-xs font-bold uppercase tracking-widest hover:bg-[#d4af37]/10 transition-all"
          >
            Envoyer un autre message
          </button>
        </motion.div>
      </div>
    );
  }

  // ─── PAGE PRINCIPALE ───────────────────────────────────────────────
  return (
    <div className="min-h-screen pt-24 pb-20 bg-[#050505] text-white relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,175,55,0.06)_0%,transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,rgba(212,175,55,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* ── EN-TÊTE ─────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-[#d4af37]/20 to-transparent border border-[#d4af37]/30 mb-4">
            <Star className="w-6 h-6 text-[#d4af37] fill-[#d4af37]" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-white font-heading uppercase tracking-widest">
            Contactez-
            <span className="bg-gradient-to-br from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
              nous
            </span>
          </h1>
          <p className="text-neutral-400 mt-4 max-w-lg mx-auto text-sm leading-relaxed">
            Une question, un partenariat ou une candidature ? N'hésitez pas à
            nous écrire. Notre équipe est à votre écoute.
          </p>
        </motion.div>

        {/* ── GRILLE PRINCIPALE ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* ── COLONNE GAUCHE — INFOS DE CONTACT ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
              <h2 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#d4af37]" />
                Informations
              </h2>

              {contactInfos.map((info, i) => (
                <motion.div
                  key={info.label}
                  custom={i}
                  initial="hidden"
                  animate="visible"
                  variants={fadeUp}
                  className="group"
                >
                  {info.href ? (
                    <a
                      href={info.href}
                      className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-all duration-300"
                    >
                      <div className="p-2.5 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 shrink-0 group-hover:bg-[#d4af37]/20 transition-colors">
                        <info.icon className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold block mb-0.5">
                          {info.label}
                        </span>
                        <span className="text-white text-sm font-medium group-hover:text-[#d4af37] transition-colors">
                          {info.value}
                        </span>
                      </div>
                    </a>
                  ) : (
                    <div className="flex items-start gap-4 p-4 rounded-2xl">
                      <div className="p-2.5 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/20 shrink-0">
                        <info.icon className="w-4 h-4 text-[#d4af37]" />
                      </div>
                      <div>
                        <span className="text-neutral-500 text-[10px] uppercase tracking-widest font-bold block mb-0.5">
                          {info.label}
                        </span>
                        <span className="text-white text-sm font-medium">
                          {info.value}
                        </span>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Réseaux sociaux */}
            <div className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
              <h3 className="text-white font-bold text-xs uppercase tracking-widest mb-4">
                Suivez-nous
              </h3>
              <div className="flex items-center gap-3">
                {[
                  {
                    name: 'Facebook',
                    href: 'https://facebook.com',
                    svg: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
                  },
                  {
                    name: 'Instagram',
                    href: 'https://instagram.com',
                    svg: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
                  },
                  {
                    name: 'YouTube',
                    href: 'https://youtube.com',
                    svg: 'M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
                  },
                  {
                    name: 'TikTok',
                    href: 'https://tiktok.com',
                    svg: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
                  },
                ].map((social) => (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-xl border border-neutral-800 flex items-center justify-center text-neutral-500 hover:text-[#d4af37] hover:border-[#d4af37]/30 hover:bg-[#d4af37]/5 transition-all duration-300"
                    aria-label={social.name}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d={social.svg} />
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          </motion.div>

          {/* ── COLONNE DROITE — FORMULAIRE ── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-3"
          >
            <form
              onSubmit={handleSubmit}
              className="bg-[#0b0b0b]/60 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(212,175,55,0.03)] rounded-3xl p-6 sm:p-10 space-y-6"
            >
              <h2 className="text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 mb-2">
                <Send className="w-4 h-4 text-[#d4af37]" />
                Envoyez-nous un message
              </h2>

              {/* Nom complet */}
              <div>
                <label className="flex items-center gap-2 text-neutral-400 font-bold mb-2 uppercase tracking-wider text-[10px]">
                  <User className="w-3.5 h-3.5 text-[#d4af37]" />
                  Nom complet
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex : Jean-Pierre Kamga"
                  className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="flex items-center gap-2 text-neutral-400 font-bold mb-2 uppercase tracking-wider text-[10px]">
                  <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                  Adresse email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="votre@email.com"
                  className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all"
                />
              </div>

              {/* Sujet */}
              <div>
                <label className="flex items-center gap-2 text-neutral-400 font-bold mb-2 uppercase tracking-wider text-[10px]">
                  <MessageSquare className="w-3.5 h-3.5 text-[#d4af37]" />
                  Sujet
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all appearance-none cursor-pointer"
                >
                  <option value="" disabled className="text-neutral-600">
                    Sélectionnez un sujet
                  </option>
                  <option value="general">Question générale</option>
                  <option value="candidature">Candidature</option>
                  <option value="partenariat">Partenariat / Sponsoring</option>
                  <option value="presse">Presse / Médias</option>
                  <option value="technique">Support technique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              {/* Message */}
              <div>
                <label className="flex items-center gap-2 text-neutral-400 font-bold mb-2 uppercase tracking-wider text-[10px]">
                  <Mail className="w-3.5 h-3.5 text-[#d4af37]" />
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={5}
                  placeholder="Décrivez votre demande en détail..."
                  className="w-full px-5 py-4 bg-[#050505] border border-white/10 rounded-2xl text-white text-sm placeholder:text-neutral-600 focus:outline-none focus:border-[#d4af37]/50 focus:ring-1 focus:ring-[#d4af37]/50 transition-all resize-none"
                />
              </div>

              {/* Bouton d'envoi */}
              <button
                type="submit"
                disabled={sending}
                className="w-full py-4 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black font-black uppercase tracking-widest text-sm rounded-xl hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] disabled:opacity-60 disabled:cursor-wait transition-all duration-300 flex items-center justify-center gap-2"
              >
                {sending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Envoyer le message
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
