import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Star,
  Award,
  Mic,
  Music,
  Building2,
  Users,
  MapPin,
  Calendar,
  Clock,
  Wallet,
  Trophy,
  Tv,
  Phone,
  Mail,
  Globe,
  ArrowRight,
} from 'lucide-react';
import SponsorMarquee from '@/components/shared/SponsorMarquee';
import { useThemeStore } from '@/store/useThemeStore';

const DEFAULT_INFOS_CLES = [
  { label: 'Organisateur', value: 'Mood & Com — Douala, Cameroun' },
  { label: 'Lieu', value: "Cinéma L'Éden, Bessengue, Douala" },
  { label: 'Casting', value: '20 & 30 Juin 2026 — Inscription gratuite' },
  { label: 'Période de vote', value: '07 Juillet — 28 Août 2026' },
  { label: 'Durée', value: '8 semaines de compétition' },
  { label: 'Prix du vote', value: '100 FCFA = 1 vote · Votes illimités' },
  { label: 'Dotation totale', value: '7 000 000 FCFA' },
  { label: 'Diffusion', value: 'Made in Mboa · Canal 2 International' },
  { label: 'Contact', value: '677 103 475 / 698 900 627' },
  { label: 'Email', value: 'contact@mboanextstar.com' },
  { label: 'Site web', value: 'www.mboanextstar.com' },
];

const DEFAULT_CATEGORIES = [
  { nom: 'Chant', desc: 'Artistes vocaux, chanteurs et chanteuses de tous styles musicaux' },
  { nom: 'Deejay', desc: 'DJs et mixeurs professionnels' },
  { nom: 'Danse', desc: 'Danseurs et danseuses, tous styles urbains et traditionnels' },
  { nom: 'Humour', desc: 'Comédiens, humoristes et artistes de stand-up' },
  { nom: 'Miss', desc: 'Candidates de la catégorie Miss Mboa Next Star' },
  { nom: 'Master', desc: 'Candidats de la catégorie Master Mboa Next Star' },
];

const DEFAULT_MEDIAS = [
  { nom: 'Made in Mboa', desc: 'Plateforme digitale de contenu camerounais' },
  { nom: 'Canal 2 International', desc: 'Chaîne de télévision nationale — diffusion télévisée' },
];

const getInfoIcon = (label: string) => {
  const norm = label.toLowerCase();
  if (norm.includes('organi')) return Building2;
  if (norm.includes('lieu') || norm.includes('adresse') || norm.includes('ville')) return MapPin;
  if (norm.includes('casting') || norm.includes('période') || norm.includes('vote') || norm.includes('calendrier') || norm.includes('date')) return Calendar;
  if (norm.includes('durée') || norm.includes('temps')) return Clock;
  if (norm.includes('prix') || norm.includes('wallet') || norm.includes('tarif')) return Wallet;
  if (norm.includes('dotation') || norm.includes('trophy') || norm.includes('gain') || norm.includes('prix')) return Trophy;
  if (norm.includes('diffusion') || norm.includes('tv') || norm.includes('télé')) return Tv;
  if (norm.includes('contact') || norm.includes('phone') || norm.includes('tél') || norm.includes('whatsapp')) return Phone;
  if (norm.includes('email') || norm.includes('mail')) return Mail;
  return Globe;
};

const getLegendIcon = (index: number) => {
  switch (index) {
    case 0: return Music;
    case 1: return Award;
    case 2: return Building2;
    default: return Users;
  }
};

const About = () => {
  const assets = useThemeStore((state) => state.assets);

  // 1. Hero
  const aboutPresenter = assets.about_presenter || "Mood & Com Présente";
  const aboutTitle = assets.about_title || "Mboa Next\nStar 2026";
  const aboutDesc = assets.about_desc || "Le plus grand programme national de révélation et de propulsion des talents urbains et culturels du Cameroun.";

  // 2. Concept
  const aboutConceptText = assets.about_concept_text || "Mboa Next Star est une compétition de talents ouverte à tous les artistes camerounais. Organisée par Mood & Com, elle se déroule du 07 Juillet au 28 Août 2026 au Cinéma L'Éden de Bessengue, Douala, sur une durée de 8 semaines de compétition.";
  const aboutConceptImages: string[] = (() => {
    try {
      if (assets.about_concept_images) {
        const parsed = JSON.parse(assets.about_concept_images);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      "/images/pressbook/biographie.jpeg",
      "/images/pressbook/mboa-trap.jpeg",
      "/images/pressbook/events.jpeg"
    ];
  })();

  // 3. Aventure
  const aboutAdventureTitle = assets.about_adventure_title || "MBOA NEXT STAR";
  const aboutAdventureDesc = assets.about_adventure_desc || "Plus qu'un simple concours, c'est une véritable académie et un tremplin pour les talents urbains du Cameroun. Une aventure humaine et artistique exceptionnelle.";
  const aboutAdventureSteps = (() => {
    try {
      if (assets.about_adventure_steps) {
        const parsed = JSON.parse(assets.about_adventure_steps);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      { title: "La Détection", text: "Des auditions digitales et physiques rigoureuses pour dénicher les pépites brutes aux quatre coins du Cameroun dans 5 catégories majeures (Chant, Danse, DJ, Humour, Miss & Master)." },
      { title: "La Formation", text: "Un Bootcamp intensif encadré par des professionnels de l'industrie musicale et du spectacle. Au programme : masterclasses, expression scénique, personal branding et droits d'auteur." },
      { title: "La Consécration", text: "Une grande finale retransmise en direct où le public et le jury décident des grands gagnants. Une visibilité massive et un accompagnement post-concours pour lancer leur carrière." }
    ];
  })();

  // Graal
  const aboutGraalAmount = assets.about_graal_amount || "7 000 000 FCFA";
  const aboutGraalSubtitle = assets.about_graal_subtitle || "De dotation totale à se partager";
  const aboutGraalDesc = assets.about_graal_desc || "Les vainqueurs de chaque catégorie repartiront avec un chèque, la production d'un projet professionnel (clip, EP, booking), un accompagnement marketing et des contrats avec nos partenaires.";

  // 3.5 Tony Nobody
  const aboutLegendTag = assets.about_legend_tag || "L'Initiateur du Projet";
  const aboutLegendTitle = assets.about_legend_title || "Tony Nobody\nThe Legend";
  const aboutLegendDesc = assets.about_legend_desc || "Présenté par ses pairs et le public comme une véritable légende de la culture urbaine Camerounaise.";
  const aboutLegendImage = assets.about_legend_image || "/images/pressbook/hero-legend.jpeg";
  const aboutLegendBio1 = assets.about_legend_bio1 || "Il a fait et continue de faire avancer des milliers d'années lumières, la musique et la culture urbaine de son pays le Cameroun.";
  const aboutLegendBio2 = assets.about_legend_bio2 || "En tant qu'acteur aux multiples tentacules, il trouve du temps à faire de la musique quand il ne donne pas la main à ceux qui en ont besoin dans ce vaste chantier en construction.";
  const aboutLegendBoxTitle = assets.about_legend_box_title || "Artiste et Producteur";
  const aboutLegendBoxDesc = assets.about_legend_box_desc || "1 Album et de multiples singles. Il a aussi produit une kyrielle d'artistes majeurs de la scène locale. Créateur et compositeur du groupe mythique BANTOU POSSE.";

  const aboutLegendGrid = (() => {
    try {
      if (assets.about_legend_grid) {
        const parsed = JSON.parse(assets.about_legend_grid);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return [
      { title: "Innovateur Musical", text: 'Il crée le concept MBOA TRAP avec les titres "DANSE D\'ABORD" et "DEBOUT".' },
      { title: "Love Peace Respect", text: "Après la sortie de son 1er album éponyme, il enregistre et garde autant de titres magiques différents les uns des autres." },
      { title: "Mood & Com", text: "Promoteur de MOOD & COM, l'agence, la boite, le label situé au-delà de la communication et de la production." },
      { title: "SYNAMURCA", text: "Aujourd'hui Président du Syndicat des Acteurs des Musiques Urbaines." }
    ];
  })();

  // 4. Infos clés
  const aboutInfosCles = (() => {
    try {
      if (assets.about_infos_cles) {
        const parsed = JSON.parse(assets.about_infos_cles);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return DEFAULT_INFOS_CLES;
  })();

  // 5. Catégories
  const categoriesList = (() => {
    try {
      if (assets.category_details) {
        const parsed = JSON.parse(assets.category_details);
        return Object.keys(parsed).map(key => ({
          nom: parsed[key].nom || key,
          desc: parsed[key].desc || ""
        }));
      }
    } catch(e) {}
    return DEFAULT_CATEGORIES;
  })();

  // 6. Médias
  const aboutMedias = (() => {
    try {
      if (assets.about_medias) {
        const parsed = JSON.parse(assets.about_medias);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return DEFAULT_MEDIAS;
  })();

  return (
    <div className="min-h-screen bg-background text-white font-sans pt-20">
      
      {/* =====================================================================
          1. HERO SECTION (MBOA NEXT STAR)
          ===================================================================== */}
      <section className="relative w-full py-32 px-6 flex flex-col items-center justify-center min-h-[60vh] bg-[#050505] text-center border-b border-white/5 overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_center,rgba(212,175,55,0.15)_0%,transparent_70%)]"></div>
        
        <div className="relative z-10 max-w-5xl mx-auto space-y-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <span className="text-[#d4af37] text-xs font-bold uppercase tracking-[0.4em]">{aboutPresenter}</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.7 }}
            className="text-[3rem] sm:text-[5rem] md:text-[7rem] lg:text-[8rem] font-black uppercase font-heading leading-[0.85] tracking-tight whitespace-pre-wrap"
          >
            {(() => {
              const parts = aboutTitle.split('\n');
              return (
                <>
                  {parts[0]}<br/>
                  {parts[1] && (
                    <span className="bg-gradient-to-br from-white via-neutral-200 to-neutral-500 bg-clip-text text-transparent">
                      {parts[1]}
                    </span>
                  )}
                </>
              );
            })()}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-neutral-400 text-base sm:text-lg md:text-xl max-w-3xl mx-auto leading-relaxed"
          >
            {aboutDesc}
          </motion.p>
        </div>
      </section>

      {/* =====================================================================
          2. LE CONCEPT (TEXTE & IMAGES PRESSBOOK)
          ===================================================================== */}
      <section className="py-24 px-6 bg-[#080808]">
        <div className="max-w-5xl mx-auto space-y-16">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center"
          >
            <p className="text-neutral-300 text-lg sm:text-xl leading-loose max-w-4xl mx-auto">
              {aboutConceptText}
            </p>
          </motion.div>

          {/* GRILLE D'IMAGES PRESS BOOK */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {aboutConceptImages.map((src, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: idx * 0.1 }}
                className="w-full h-72 rounded-2xl overflow-hidden border border-white/10 bg-surface/50 group"
              >
                <img 
                  src={src} 
                  alt={`Concept ${idx + 1}`} 
                  className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516280440503-6c9fa5c62de2?q=80&w=800&auto=format&fit=crop';
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. LE CONCEPT MBOA NEXT STAR & LES RÉCOMPENSES
          ===================================================================== */}
      <section className="py-24 px-6 border-y border-white/5 bg-[#080808]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <Star className="w-10 h-10 text-primary mx-auto mb-6 opacity-80" />
            <h2 className="text-3xl sm:text-5xl font-black font-heading tracking-[-0.026em] uppercase mb-6">
              L'Aventure <span className="bg-gradient-to-br from-primary via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">{aboutAdventureTitle}</span>
            </h2>
            <p className="text-neutral-400 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed">
              {aboutAdventureDesc}
            </p>
          </div>

          {/* Grille des caractéristiques clés */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            {aboutAdventureSteps.map((step, idx) => (
              <div key={idx} className="bg-surface/40 border border-white/5 p-8 rounded-3xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-[50px] group-hover:bg-primary/20 transition-colors" />
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 border border-primary/20">
                  <span className="text-primary text-2xl font-black">{idx + 1}</span>
                </div>
                <h3 className="text-white text-xl font-bold uppercase tracking-wider mb-4">{step.title}</h3>
                <p className="text-neutral-400 leading-relaxed text-sm">
                  {step.text}
                </p>
              </div>
            ))}
          </div>

          {/* Section Récompense */}
          <div className="bg-gradient-to-br from-[#1a1500] to-[#0a0800] border border-primary/30 rounded-[2.5rem] p-8 sm:p-12 text-center relative overflow-hidden">
            {/* Effet de brillance en arrière plan */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-[600px] bg-primary/20 blur-[100px] rounded-full pointer-events-none" />
            
            <div className="relative z-10">
              <span className="inline-block py-1.5 px-4 rounded-full border border-primary/40 bg-primary/20 text-primary text-xs font-bold uppercase tracking-[0.2em] mb-6">
                Le Graal
              </span>
              <h3 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-widest mb-4">
                {aboutGraalAmount.split(' ').map((w, i) => i === 0 ? w : <span key={i} className="text-primary ml-2">{w}</span>)}
              </h3>
              <p className="text-neutral-300 text-lg sm:text-xl font-medium uppercase tracking-widest mb-8">
                {aboutGraalSubtitle}
              </p>
              <p className="text-neutral-400 max-w-2xl mx-auto text-sm leading-relaxed mb-10">
                {aboutGraalDesc}
              </p>
              
              <Link 
                to="/candidats"
                className="inline-flex items-center gap-3 bg-gradient-to-r from-primary to-[#b8952e] text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform duration-300 shadow-[0_0_30px_rgba(212,175,55,0.3)]"
              >
                Découvrir les talents
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3.5 TONY NOBODY THE LEGEND (INITIATEUR)
          ===================================================================== */}
      <section className="relative w-full py-24 px-6 overflow-hidden bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.08)_0%,transparent_70%)] border-t border-white/5">
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#d4af37 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
        
        <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1 space-y-6"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/10">
              <Star className="w-4 h-4 text-primary fill-primary" />
              <span className="text-primary text-xs font-semibold uppercase tracking-widest">
                {aboutLegendTag}
              </span>
            </div>
            
            <h2 className="text-5xl sm:text-7xl font-black uppercase font-heading leading-none tracking-[-0.026em] whitespace-pre-line">
              {(() => {
                const parts = aboutLegendTitle.split('\n');
                return (
                  <>
                    {parts[0]} <br/>
                    {parts[1] && (
                      <span className="bg-gradient-to-br from-primary via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent text-4xl sm:text-6xl">
                        {parts[1]}
                      </span>
                    )}
                  </>
                );
              })()}
            </h2>
            
            <p className="text-neutral-400 text-lg leading-relaxed border-l-4 border-primary pl-4">
              {aboutLegendDesc}
            </p>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 relative w-full aspect-square md:aspect-[4/5] rounded-3xl overflow-hidden border border-primary/20 bg-surface/50 p-2"
          >
            <div className="w-full h-full bg-neutral-900 rounded-2xl overflow-hidden relative group">
              <img 
                src={aboutLegendImage} 
                alt="Tony Nobody The Legend" 
                className="w-full h-full object-cover filter grayscale hover:grayscale-0 transition-all duration-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516280440503-6c9fa5c62de2?q=80&w=800&auto=format&fit=crop';
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent"></div>
              <div className="absolute bottom-6 left-6 right-6">
                <p className="text-primary font-black uppercase tracking-[0.3em] text-sm">Tony NOBODY</p>
                <p className="text-white text-xs opacity-70 tracking-widest uppercase">to become SOMEBODY</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* BIOGRAPHIE TONY NOBODY */}
      <section className="pb-24 px-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div>
              <span className="text-primary text-xs font-bold uppercase tracking-[0.25em] block mb-2">Biographie</span>
              <h3 className="text-3xl sm:text-4xl font-black font-heading uppercase text-white">
                Un pionnier au service de la culture
              </h3>
            </div>
            
            <div className="space-y-5 text-neutral-400 leading-relaxed text-sm sm:text-base">
              <p>{aboutLegendBio1}</p>
              {aboutLegendBio2 && <p>{aboutLegendBio2}</p>}
              
              <div className="bg-surface border border-primary/10 p-6 rounded-2xl mt-6">
                <div className="flex items-center gap-3 mb-3">
                  <Mic className="text-primary w-6 h-6" />
                  <h4 className="text-white font-bold uppercase tracking-wider">{aboutLegendBoxTitle}</h4>
                </div>
                <p className="text-sm">
                  {aboutLegendBoxDesc}
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {aboutLegendGrid.map((item, idx) => {
              const IconComponent = getLegendIcon(idx);
              return (
                <div key={idx} className={`bg-surface/50 border border-white/5 p-6 rounded-2xl hover:border-primary/30 transition-colors ${idx % 2 === 1 ? 'mt-0 sm:mt-8' : ''}`}>
                  <IconComponent className="text-primary w-8 h-8 mb-4" />
                  <h5 className="text-white font-bold mb-2 uppercase text-sm">{item.title}</h5>
                  <p className="text-neutral-500 text-xs leading-relaxed">
                    {item.text}
                  </p>
                </div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          4. INFORMATIONS CLÉS
          ===================================================================== */}
      <section className="py-24 px-6 bg-[#050505]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase tracking-widest text-white mb-10">
              Informations clés
            </h2>

            <div className="flex flex-col">
              {aboutInfosCles.map((info, i) => {
                const IconComponent = getInfoIcon(info.label);
                return (
                  <motion.div
                    key={info.label}
                    initial={{ opacity: 0, x: -15 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr] gap-4 py-4 border-b border-white/5 last:border-0 group"
                  >
                    <span className="flex items-center gap-2.5 text-neutral-500 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
                      <IconComponent className="w-3.5 h-3.5 text-[#d4af37]" />
                      {info.label}
                    </span>
                    <span className="text-white text-sm font-medium group-hover:text-[#d4af37] transition-colors">
                      {info.value}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          5. CATÉGORIES EN COMPÉTITION
          ===================================================================== */}
      <section className="py-24 px-6 bg-[#080808] border-y border-white/5">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase tracking-widest text-white mb-10">
              Catégories en compétition
            </h2>

            <div className="flex flex-col">
              {categoriesList.map((cat, i) => (
                <motion.div
                  key={cat.nom}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                  className="grid grid-cols-[120px_1fr] sm:grid-cols-[180px_1fr] gap-4 py-5 border-b border-white/5 last:border-0 group"
                >
                  <span className="text-white font-bold text-sm uppercase tracking-wider group-hover:text-[#d4af37] transition-colors">
                    {cat.nom}
                  </span>
                  <span className="text-neutral-400 text-sm">
                    {cat.desc}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          6. MÉDIAS PARTENAIRES
          ===================================================================== */}
      <section className="py-24 px-6 bg-[#050505]">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-xl sm:text-2xl font-black font-heading uppercase tracking-widest text-white mb-10">
              Médias partenaires
            </h2>

            <div className="flex flex-col mb-16">
              {aboutMedias.map((media, i) => (
                <motion.div
                  key={media.nom}
                  initial={{ opacity: 0, x: -15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="grid grid-cols-[180px_1fr] gap-4 py-5 border-b border-white/5 last:border-0 group"
                >
                  <span className="text-white font-bold text-sm uppercase tracking-wider group-hover:text-[#d4af37] transition-colors">
                    {media.nom}
                  </span>
                  <span className="text-neutral-400 text-sm">
                    {media.desc}
                  </span>
                </motion.div>
              ))}
            </div>

            {/* Boutons d'action */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link
                to="/candidats"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#b8952e] text-black px-8 py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:shadow-[0_0_25px_rgba(212,175,55,0.4)] transition-all"
              >
                Voter maintenant
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/reglement"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-neutral-300 text-xs font-bold uppercase tracking-widest hover:border-[#d4af37]/30 hover:text-white transition-all"
              >
                Lire le règlement
              </Link>
              <Link
                to="/contact"
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 text-neutral-300 text-xs font-bold uppercase tracking-widest hover:border-[#d4af37]/30 hover:text-white transition-all"
              >
                Nous contacter
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* =====================================================================
          7. SPONSORS BOTTOM
          ===================================================================== */}
      <div className="w-full bg-neutral-950 py-5">
        <SponsorMarquee />
      </div>

    </div>
  );
};

export default About;
