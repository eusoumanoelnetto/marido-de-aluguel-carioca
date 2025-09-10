export type ServiceCategory = 'Elétrica' | 'Hidráulica' | 'Pintura' | 'Montagem de Móveis' | 'Reparos Gerais' | 'Manutenção Geral' | 'Informática' | 'CFTV';

export interface ServiceRequest {
  id: string;
  clientName: string;
  clientEmail?: string; // novo: referência ao cliente
  address: string;
  contact: string;
  category: ServiceCategory;
  description: string;
  photoBase64: string | null;
  // Novo fluxo: quando prestador envia orçamento vira 'Orçamento Enviado' e só depois que o cliente aceita passa a 'Aceito'
  status: 'Pendente' | 'Orçamento Enviado' | 'Aceito' | 'Recusado' | 'Finalizado' | 'Cancelado';
  isEmergency?: boolean;
  quote?: number;
  providerEmail?: string; // prestador que enviou orçamento / foi escolhido
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
  // adicionado 'admin' para suportar painel administrativo
  role: 'client' | 'provider' | 'admin';
  cep: string;
  password?: string;
  profilePictureBase64?: string | null;
  services?: string[];
  created_at?: string; // ISO timestamp
  last_login_at?: string | null; // ISO timestamp
}

export interface SignUpData {
  name: string;
  email: string;
  phone: string;
  role: 'client' | 'provider' | 'admin';
  cep: string;
  password?: string;
  services?: string[];
}
