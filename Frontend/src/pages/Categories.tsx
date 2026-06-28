// =============================================================================
// PAGE CATÉGORIES — Présentation visuelle des différentes catégories
// =============================================================================

import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

import { useThemeStore } from '@/store/useThemeStore';

const categories = [
  {
    id: 'chant',
    nom: 'Chant',
    image: '/images/categories/chant.jpg',
    desc: 'Artistes vocaux, chanteurs et chanteuses de tous styles musicaux',
  },
  {
    id: 'deejay',
    nom: 'Deejay',
    image: '/images/categories/deejay.jpg',
    desc: 'DJs et mixeurs professionnels',
  },
  {
    id: 'danse',
    nom: 'Danse',
    image: '/images/categories/danse.png',
    desc: 'Danseurs et danseuses, tous styles urbains et traditionnels',
  },
  {
    id: 'humour',
    nom: 'Humour',
    image: '/images/categories/comedie.png',
    desc: 'Comédiens, humoristes et artistes de stand-up',
  },
  {
    id: 'miss',
    nom: 'Miss',
    image: '/images/categories/miss.jpg',
    desc: 'Candidates de la catégorie Miss Mboa Next Star',
  },
  {
    id: 'master',
    nom: 'Master',
    image: '/images/categories/miss.jpg',
    desc: 'Candidats de la catégorie Master Mboa Next Star',
  },
];

const Categories = () => {
  const assets = useThemeStore((state) => state.assets);
  const dynamicDetails = (() => {
    try {
      if (assets.category_details) {
        return JSON.parse(assets.category_details);
      }
    } catch (e) {
      console.error('Error parsing category_details', e);
    }
    return null;
  })();

  const mergedCategories = categories.map(cat => {
    if (dynamicDetails && dynamicDetails[cat.id]) {
      return {
        ...cat,
        image: dynamicDetails[cat.id].image || cat.image,
        desc: dynamicDetails[cat.id].desc || cat.desc,
        nom: dynamicDetails[cat.id].nom || cat.nom,
      };
    }
    return cat;
  });

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans pt-32 pb-24">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(212,175,55,0.04)_0%,transparent_60%)] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
          >
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black uppercase font-heading tracking-[-0.02em] mb-6"
          >
            Les <span className="bg-gradient-to-r from-[#d4af37] via-[#fff3c4] to-[#b8952e] bg-clip-text text-transparent">Catégories</span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-neutral-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Découvrez les 6 disciplines officielles de l'aventure MBOA NEXT STAR 2026. Soutenez vos talents favoris dans chaque catégorie.
          </motion.p>
        </div>

        {/* Grille des catégories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {mergedCategories.map((cat, index) => (
            <motion.div
              key={cat.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                to={`/candidats?category=${cat.id}`}
                className="group relative block w-full h-[400px] rounded-[2rem] overflow-hidden bg-neutral-900 border border-white/5 hover:border-[#d4af37]/30 transition-all duration-500 shadow-2xl"
              >
                {/* Image de fond */}
                <div className="absolute inset-0 w-full h-full">
                  <img
                    src={cat.image}
                    alt={cat.nom}
                    className="w-full h-full object-cover opacity-60 group-hover:opacity-80 group-hover:scale-110 transition-all duration-700 ease-in-out filter grayscale group-hover:grayscale-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1516280440503-6c9fa5c62de2?q=80&w=800&auto=format&fit=crop';
                    }}
                  />
                </div>

                {/* Overlay gradient pour la lisibilité */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/60 to-transparent opacity-90 group-hover:opacity-75 transition-opacity duration-500" />

                {/* Contenu */}
                <div className="absolute inset-0 p-8 flex flex-col justify-end">
                  <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                    <h2 className="text-3xl font-black uppercase text-white mb-3 tracking-wider group-hover:text-[#d4af37] transition-colors">
                      {cat.nom}
                    </h2>
                    <p className="text-neutral-300 text-sm leading-relaxed mb-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-100">
                      {cat.desc}
                    </p>
                    
                    <div className="inline-flex items-center gap-2 text-[#d4af37] text-xs font-bold uppercase tracking-widest">
                      Voir les candidats
                      <ArrowRight className="w-4 h-4 transform group-hover:translate-x-2 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Categories;
