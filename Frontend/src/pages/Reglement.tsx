// =============================================================================
// PAGE RÈGLEMENT — FAQ et Articles du concours en accordéon animé
// =============================================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Shield, Star } from 'lucide-react';

import { useThemeStore } from '@/store/useThemeStore';

interface ArticleItem {
  title: string;
  content: string;
}

const ARTICLES: ArticleItem[] = [
  {
    title: 'Article 1 — Objet du Concours',
    content:
      'MBOA NEXT STAR est un concours national de talents urbains organisé au Cameroun. Il vise à découvrir, promouvoir et propulser de nouveaux artistes dans les domaines de la musique (chant), la danse, l\'humour, le deejaying et la catégorie Miss & Master. Le concours se déroule entièrement en ligne via une plateforme de vote dédiée, avec des événements live ponctuels.',
  },
  {
    title: 'Article 2 — Conditions de Participation',
    content:
      'Le concours est ouvert à toute personne résidant au Cameroun, sans limite d\'âge. Pour participer, le candidat doit être inscrit par un coach officiel de MBOA NEXT STAR. Après inscription, le candidat reçoit un code OTP par WhatsApp pour vérifier son identité et compléter son profil (biographie de 300 mots minimum, photo de profil et vidéo de prestation). Les candidats mineurs doivent avoir l\'autorisation de leur représentant légal.',
  },
  {
    title: 'Article 3 — Catégories',
    content:
      'Le concours comporte cinq (5) catégories principales :\n\n• Chant / Chanson — Performances vocales (a cappella, covers, compositions originales)\n• Danse — Chorégraphies individuelles ou en groupe (tous styles)\n• Humour / Comédie — Sketches, stand-up, improvisations\n• Deejay (DJ) — Mix live, scratch, production musicale\n• Miss & Master — Élégance, charisme, présentation et talent\n\nChaque candidat ne peut s\'inscrire que dans une seule catégorie. Un changement de catégorie n\'est possible qu\'avant l\'ouverture des votes.',
  },
  {
    title: 'Article 4 — Modalités de Vote',
    content:
      'Les votes sont ouverts au public via paiement Mobile Money (Orange Money et MTN MoMo) au tarif de 100 FCFA par vote. Un même utilisateur peut voter un nombre illimité de fois pour le même candidat ou pour des candidats différents. Chaque vote correspond à une transaction de paiement validée. Les votes en statut "PENDING" ou "FAILED" ne sont pas comptabilisés. Le classement est mis à jour en temps réel après chaque transaction réussie.',
  },
  {
    title: 'Article 5 — Prix et Dotations',
    content:
      'La dotation globale du concours s\'élève à 7 000 000 FCFA, répartie entre les gagnants des différentes catégories. Le grand vainqueur de chaque catégorie remporte :\n\n• Un prix en espèces\n• Un accompagnement artistique professionnel\n• Une visibilité médiatique nationale\n• Des sessions d\'enregistrement en studio professionnel\n\nLa répartition exacte des prix sera communiquée avant la phase finale du concours.',
  },
  {
    title: 'Article 6 — Système Anti-Triche',
    content:
      'Le système de vote payant constitue en lui-même un mécanisme anti-triche naturel : chaque vote nécessite une transaction financière réelle, rendant impraticable toute tentative de fraude automatisée (bots, scripts, fermes à clics). En complément, l\'équipe technique surveille les patterns de vote suspects (volumes anormaux, transactions groupées depuis un même numéro en rafale). Tout candidat reconnu coupable de manipulation des votes sera immédiatement disqualifié sans remboursement des votes reçus.',
  },
  {
    title: 'Article 7 — Calendrier',
    content:
      'Le concours MBOA NEXT STAR 2026 se déroule selon le calendrier suivant :\n\n• Inscriptions et vérification des profils : Juin — Juillet 2026\n• Ouverture des votes au public : 07 Juillet 2026\n• Clôture des votes : 28 Août 2026 (8 semaines de compétition)\n• Auditions live des finalistes : Septembre 2026\n• Grande Finale : Dates à confirmer\n\nToute modification du calendrier sera communiquée sur la plateforme officielle et les réseaux sociaux de MBOA NEXT STAR.',
  },
  {
    title: 'Article 8 — Droits et Obligations',
    content:
      'En participant au concours, chaque candidat :\n\n• Autorise l\'utilisation de son image, son nom et ses prestations à des fins promotionnelles liées au concours\n• S\'engage à respecter les règles de bonne conduite et de fair-play\n• Certifie que les contenus soumis (vidéos, photos) sont libres de droits ou lui appartiennent\n• Accepte les décisions de l\'organisation concernant la modération des profils\n\nL\'organisation se réserve le droit de suspendre ou supprimer tout profil jugé inapproprié, offensant ou non conforme aux standards du concours.',
  },
  {
    title: 'Article 9 — Disqualification',
    content:
      'Un candidat peut être disqualifié dans les cas suivants :\n\n• Fraude avérée ou tentative de manipulation des votes\n• Contenus inappropriés, violents, discriminatoires ou portant atteinte à l\'ordre public\n• Usurpation d\'identité ou fausses informations dans le profil\n• Comportement irrespectueux envers les autres candidats, le jury ou l\'organisation\n• Non-respect répété des consignes de l\'organisation\n\nEn cas de disqualification, les votes reçus ne sont pas remboursés aux votants et le candidat perd tout droit aux prix.',
  },
  {
    title: 'Article 10 — Dispositions Finales',
    content:
      'La participation au concours implique l\'acceptation pleine et entière du présent règlement. L\'organisation se réserve le droit de modifier le règlement à tout moment, les participants étant informés par notification sur la plateforme. En cas de litige, la décision de l\'organisation de MBOA NEXT STAR is sovereign and definitive. Pour toute question relative au règlement, contactez l\'équipe via la page de contact de la plateforme ou par WhatsApp au 677 103 475.',
  },
];

const Reglement = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const assets = useThemeStore((state) => state.assets);

  const titlePart1 = assets.reglement_title_part1 || "Règlement du ";
  const titlePart2 = assets.reglement_title_part2 || "Concours";
  const descValue = assets.reglement_desc || "Consultez les articles régissant le fonctionnement, les modalités de vote, les prix et les obligations de tous les participants au concours MBOA NEXT STAR 2026.";

  const articles: ArticleItem[] = (() => {
    try {
      if (assets.reglement_articles) {
        const parsed = JSON.parse(assets.reglement_articles);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Error parsing reglement_articles', e);
    }
    return ARTICLES;
  })();

  const toggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-[#d4af37] selection:text-black pt-36 pb-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.04)_0%,transparent_60%)] pointer-events-none" />

      <section className="relative z-10 w-full max-w-4xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-black uppercase font-heading tracking-[-0.02em]"
          >
            {titlePart1}
            <span className="bg-gradient-to-r from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">
              {titlePart2}
            </span>
          </motion.h1>
          <p className="text-neutral-400 text-sm sm:text-base mt-4 max-w-xl mx-auto leading-relaxed">
            {descValue}
          </p>
        </div>

        {/* Avertissement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-start gap-4 p-5 rounded-2xl bg-[#d4af37]/5 border border-[#d4af37]/15 mb-10"
        >
          <Shield className="w-5 h-5 text-[#d4af37] shrink-0 mt-0.5" />
          <p className="text-neutral-300 text-sm leading-relaxed">
            La participation au concours implique l'acceptation pleine et entière du présent règlement.
            Tout manquement aux règles ci-dessous peut entraîner la <strong className="text-white">disqualification immédiate</strong> du candidat.
          </p>
        </motion.div>

        {/* Accordéon */}
        <div className="space-y-3">
          {articles.map((article, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className={`rounded-2xl border transition-all duration-500 overflow-hidden ${
                  isOpen
                    ? 'border-[#d4af37]/30 bg-[#0b0b0b]/60 shadow-[0_0_30px_rgba(212,175,55,0.05)]'
                    : 'border-white/5 bg-[#0b0b0b]/30 hover:border-white/15'
                }`}
              >
                {/* Header de l'article */}
                <button
                  onClick={() => toggle(index)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 ${
                      isOpen ? 'bg-[#d4af37] text-black' : 'bg-white/5 text-neutral-500 group-hover:bg-[#d4af37]/10 group-hover:text-[#d4af37]'
                    }`}>
                      <span className="text-xs font-black">{index + 1}</span>
                    </div>
                    <h3 className={`font-bold text-sm sm:text-base transition-colors duration-300 ${
                      isOpen ? 'text-white' : 'text-neutral-300 group-hover:text-white'
                    }`}>
                      {article.title}
                    </h3>
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                    isOpen ? 'rotate-180 text-[#d4af37]' : 'text-neutral-600 group-hover:text-neutral-400'
                  }`} />
                </button>

                {/* Contenu de l'article */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    >
                      <div className="px-6 pb-6 pt-0">
                        <div className="pl-12 border-l-2 border-[#d4af37]/20">
                          <p className="text-neutral-400 text-sm leading-relaxed whitespace-pre-line">
                            {article.content}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>

        {/* CTA bas de page */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-4 h-4 text-[#d4af37] fill-[#d4af37]" />
            ))}
          </div>
          <p className="text-neutral-400 text-sm mb-6">
            Des questions sur le règlement ?{' '}
            <a href="/contact" className="text-[#d4af37] font-semibold hover:underline underline-offset-4">
              Contactez-nous
            </a>
          </p>
        </motion.div>
      </section>
    </div>
  );
};

export default Reglement;
