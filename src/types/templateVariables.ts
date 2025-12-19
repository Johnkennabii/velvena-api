/**
 * Variables disponibles dans les templates de contrat
 * Ces variables sont injectées lors du rendu des templates avec Handlebars
 */

export const TEMPLATE_VARIABLES = {
  // ============================
  // CLIENT
  // ============================
  'client.fullName': {
    description: 'Nom complet du client',
    example: 'Jean Dupont',
  },
  'client.firstName': {
    description: 'Prénom du client',
    example: 'Jean',
  },
  'client.lastName': {
    description: 'Nom de famille du client',
    example: 'Dupont',
  },
  'client.email': {
    description: 'Email du client',
    example: 'jean.dupont@example.com',
  },
  'client.phone': {
    description: 'Téléphone du client',
    example: '+33 6 12 34 56 78',
  },
  'client.address': {
    description: 'Adresse du client',
    example: '10 rue de Paris',
  },
  'client.city': {
    description: 'Ville du client',
    example: 'Paris',
  },
  'client.postalCode': {
    description: 'Code postal du client',
    example: '75001',
  },
  'client.country': {
    description: 'Pays du client',
    example: 'France',
  },

  // ============================
  // CONTRAT
  // ============================
  'contract.number': {
    description: 'Numéro de contrat',
    example: 'CNT-2025-001',
  },
  'contract.type': {
    description: 'Type de contrat',
    example: 'Forfait Négafa',
  },
  'contract.startDate': {
    description: 'Date de début (format court)',
    example: '15/01/2025',
  },
  'contract.startDateTime': {
    description: 'Date et heure de début',
    example: '15/01/2025 19:00',
  },
  'contract.endDate': {
    description: 'Date de fin (format court)',
    example: '16/01/2025',
  },
  'contract.endDateTime': {
    description: 'Date et heure de fin',
    example: '16/01/2025 02:00',
  },
  'contract.createdAt': {
    description: 'Date de création du contrat',
    example: '10/01/2025',
  },
  'contract.signedAt': {
    description: 'Date et heure de signature',
    example: '12/01/2025 14:30',
  },
  'contract.status': {
    description: 'Statut du contrat',
    example: 'SIGNED_ELECTRONICALLY',
  },

  // ============================
  // FINANCIER
  // ============================
  'contract.totalTTC': {
    description: 'Total TTC',
    example: '2 500,00 €',
  },
  'contract.totalHT': {
    description: 'Total HT',
    example: '2 083,33 €',
  },
  'contract.accountTTC': {
    description: 'Acompte TTC',
    example: '1 250,00 €',
  },
  'contract.accountHT': {
    description: 'Acompte HT',
    example: '1 041,67 €',
  },
  'contract.accountPaidTTC': {
    description: 'Acompte payé TTC',
    example: '1 250,00 €',
  },
  'contract.cautionTTC': {
    description: 'Caution TTC',
    example: '500,00 €',
  },
  'contract.cautionHT': {
    description: 'Caution HT',
    example: '416,67 €',
  },
  'contract.cautionPaidTTC': {
    description: 'Caution payée TTC',
    example: '500,00 €',
  },
  'contract.paymentMethod': {
    description: 'Méthode de paiement',
    example: 'Carte bancaire',
  },

  // ============================
  // ORGANISATION
  // ============================
  'org.name': {
    description: 'Nom de l\'entreprise',
    example: 'VELVENA',
  },
  'org.siret': {
    description: 'Numéro SIRET',
    example: '123 456 789 0000',
  },
  'org.address': {
    description: 'Adresse de l\'entreprise',
    example: '12 rue de la paix',
  },
  'org.city': {
    description: 'Ville de l\'entreprise',
    example: 'Paris',
  },
  'org.postalCode': {
    description: 'Code postal de l\'entreprise',
    example: '75000',
  },
  'org.country': {
    description: 'Pays de l\'entreprise',
    example: 'France',
  },
  'org.fullAddress': {
    description: 'Adresse complète de l\'entreprise',
    example: '12 rue de la Paix, 75002 Paris',
  },
  'org.email': {
    description: 'Email de l\'entreprise',
    example: 'contact@velvena.fr',
  },
  'org.phone': {
    description: 'Téléphone de l\'entreprise',
    example: '+33 1 01 01 01 01',
  },
  'org.managerGender': {
    description: 'Genre du gérant (Mr, Mme, Mx)',
    example: 'Monsieur',
  },
  'org.managerFirstName': {
    description: 'Prénom du gérant',
    example: 'Jean',
  },
  'org.managerLastName': {
    description: 'Nom du gérant',
    example: 'Dupont',
  },
  'org.managerFullName': {
    description: 'Nom complet du gérant',
    example: 'Jean Dupont',
  },
  'org.managerTitle': {
    description: 'Titre/Poste du gérant',
    example: 'gérante',
  },
  'org.managerInitials': {
    description: 'Initiales du gérant',
    example: 'H. N.',
  },

  // ============================
  // SIGNATURE (si électronique)
  // ============================
  'signature.date': {
    description: 'Date et heure de la signature électronique',
    example: '12/01/2025 14:30:15',
  },
  'signature.ip': {
    description: 'Adresse IP lors de la signature',
    example: '192.168.1.1',
  },
  'signature.location': {
    description: 'Localisation géographique lors de la signature',
    example: 'Paris, France (48.8566, 2.3522)',
  },
  'signature.reference': {
    description: 'Référence unique de la signature',
    example: 'uuid-du-token',
  },

  // ============================
  // DATES UTILES
  // ============================
  'today': {
    description: 'Date du jour',
    example: '15/01/2025',
  },

  // ============================
  // LISTES DYNAMIQUES (Handlebars loops)
  // ============================
  'dresses': {
    description: 'Liste des robes (utilisez {{#each dresses}})',
    example: [
      {
        name: 'Robe Princesse',
        reference: 'R-001',
        pricePerDay: '300,00 €',
      },
    ],
  },
  'addons': {
    description: 'Liste des options (utilisez {{#each addons}})',
    example: [
      {
        name: 'Maquillage professionnel',
        description: 'Maquillage complet pour le jour J',
        price: '150,00 €',
        includedInPackage: false,
      },
    ],
  },
} as const;

export type TemplateVariableKey = keyof typeof TEMPLATE_VARIABLES;

/**
 * Helper pour obtenir la description d'une variable
 */
export function getVariableDescription(key: string): string {
  return (TEMPLATE_VARIABLES as any)[key]?.description || 'Variable inconnue';
}

/**
 * Helper pour obtenir l'exemple d'une variable
 */
export function getVariableExample(key: string): any {
  return (TEMPLATE_VARIABLES as any)[key]?.example || '';
}
