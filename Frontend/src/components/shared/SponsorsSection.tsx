/**
 * @file SponsorsSection.tsx
 * @description Composant pour afficher la section des sponsors/partenaires
 */

import { useEffect, useState } from 'react';
import { getSponsors, type Sponsor } from '../../services/sponsorService';

export const SponsorsSection = () => {
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSponsors = async () => {
      try {
        setLoading(true);
        const data = await getSponsors();
        setSponsors(data);
      } catch (err) {
        console.error('Erreur lors du chargement des sponsors:', err);
        setError('Impossible de charger les sponsors');
      } finally {
        setLoading(false);
      }
    };

    fetchSponsors();
  }, []);

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nos Partenaires
          </h2>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">
            Nos Partenaires
          </h2>
          <p className="text-center text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  if (sponsors.length === 0) {
    return null;
  }

  // Regrouper les sponsors par niveau (tier)
  const sponsorsByTier = sponsors.reduce((acc, sponsor) => {
    if (!acc[sponsor.tier]) {
      acc[sponsor.tier] = [];
    }
    acc[sponsor.tier].push(sponsor);
    return acc;
  }, {} as Record<string, Sponsor[]>);

  const tierOrder = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'PARTNER'];
  const tierLabels = {
    PLATINUM: 'Partenaires Platine',
    GOLD: 'Partenaires Or',
    SILVER: 'Partenaires Argent',
    BRONZE: 'Partenaires Bronze',
    PARTNER: 'Partenaires',
  };

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center mb-12">
          Nos Partenaires
        </h2>

        {tierOrder.map((tier) => {
          const tierSponsors = sponsorsByTier[tier];
          if (!tierSponsors || tierSponsors.length === 0) return null;

          return (
            <div key={tier} className="mb-12">
              <h3 className="text-2xl font-semibold text-center mb-8 text-gray-700">
                {tierLabels[tier as keyof typeof tierLabels]}
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 items-center justify-items-center">
                {tierSponsors.map((sponsor) => (
                  <div
                    key={sponsor.id}
                    className="flex flex-col items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                  >
                    {sponsor.logoUrl ? (
                      <img
                        src={sponsor.logoUrl}
                        alt={sponsor.name}
                        className="h-20 w-auto object-contain mb-2"
                      />
                    ) : sponsor.media.length > 0 && sponsor.media[0].mediaType === 'IMAGE' ? (
                      <img
                        src={sponsor.media[0].mediaUrl}
                        alt={sponsor.media[0].title || sponsor.name}
                        className="h-20 w-auto object-contain mb-2"
                      />
                    ) : (
                      <div className="h-20 flex items-center justify-center">
                        <span className="text-lg font-semibold text-gray-700">
                          {sponsor.name}
                        </span>
                      </div>
                    )}

                    {sponsor.websiteUrl && (
                      <a
                        href={sponsor.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-orange-500 hover:text-orange-600 mt-2"
                      >
                        Visiter le site
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
