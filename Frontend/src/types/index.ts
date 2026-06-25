// =============================================================================
// TYPES — Définitions TypeScript pour toute l'application MBOA NEXT STAR
// =============================================================================

/** Représente une catégorie de concours (Chanson, Danse, etc.) */
export interface Category {
  id: number;
  name: string;
  slug: string;
  candidates?: Candidate[];
}

/** Représente un candidat/artiste inscrit à la compétition */
export interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  slug: string | null;
  biography: string | null;
  profilePhoto: string | null;
  videoUrl: string | null;
  socialLinks: Record<string, string> | null;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'ACTIVE' | 'SUSPENDED';
  totalVotesCache: number;
  categoryId: number;
  category?: Category;
  createdAt: string;
}

/** Représente un vote émis par un utilisateur */
export interface Vote {
  id: number;
  candidateId: number;
  voterIdentifier: string;
  paymentReference: string;
  amount: number;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
  createdAt: string;
}

/** Représente un utilisateur administrateur (Coach / Super Admin) */
export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

/** Réponse standard de l'API backend */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/** Réponse de connexion admin */
export interface LoginResponse {
  user: User;
  token: string;
}

/** Statistiques globales du dashboard */
export interface DashboardStats {
  totalCandidates: number;
  totalVotes: number;
  totalRevenue: number;
  pendingWithdrawals: number;
  recentCandidates: any[]; // Using any[] for simplicity, or we could define a specific type
  recentVotes: any[];
}

/** Configuration visuelle du site */
export interface SiteConfig {
  key: string;
  value: string;
}
