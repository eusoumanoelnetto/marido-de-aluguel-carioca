export type ServiceCategory = 'Elétrica' | 'Hidráulica' | 'Pintura' | 'Montagem de Móveis' | 'Reparos Gerais' | 'Manutenção Geral' | 'Informática' | 'CFTV';

export interface ServiceRequest {
  id: string;
  clientName: string;
  clientEmail?: string;
  address: string;
  contact: string;
  category: ServiceCategory;
  description: string;
  photoBase64: string | null;
  status: 'Pendente' | 'Orçamento Enviado' | 'Aceito' | 'Recusado' | 'Finalizado' | 'Cancelado';
  isEmergency?: boolean;
  quote?: number;
  providerEmail?: string;
  requestDate: string; // ISO string for tracking
}

export interface SuggestedEquipment {
  tools: string[];
  materials: string[];
}

export interface SuggestedQuote {
  priceRange: string;
  quoteDetails: string;
}

export interface User {
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'provider';
  cep: string;
  password?: string;
  profilePictureBase64?: string | null;
  services?: string[];
}

export interface SignUpData {
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'provider';
  cep: string;
  password?: string;
  services?: string[];
}