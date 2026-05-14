// ============================================
// DeepLead — TypeScript Types
// Naming follows the database schema (snake_case, matching column names exactly)
// ============================================

// --- Auth & Users ---
export type PlatformRole = 'dev' | 'tester' | 'basic';
export type BusinessRole = 'gestor' | 'colaborador';
export type Segment = 'generic' | 'real_estate';
export type Locale = 'pt-BR' | 'en';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
  platform_role: PlatformRole;
  created_at: string;
  updated_at?: string;
}

export interface BusinessMember {
  id: string;
  business_id: string;
  user: User;                   // joined from core.users
  business_role: BusinessRole;
  joined_at: string;
  assigned_leads_count?: number; // computed via COUNT, not a column
}

export interface Business {
  id: string;
  name: string;
  segment: Segment;
  logo_url?: string;
  cnpj?: string;
  address?: string;
  phone?: string;
  website?: string;
  members?: BusinessMember[];   // joined from core.business_members
  created_at: string;
  updated_at?: string;
}

// --- Contacts ---
export type ContactStatus = 'new' | 'contacted' | 'in_progress' | 'converted' | 'lost';
export type ContactSource =
  | 'whatsapp' | 'instagram' | 'facebook' | 'tiktok'
  | 'website' | 'referral' | 'direct'
  | 'vivareal' | 'zapimoveis' | 'olx'
  | 'import' | 'form';

export interface Contact {
  id: string;
  business_id: string;
  name: string;
  phone?: string;
  secondary_phone?: string;
  email?: string;
  cpf?: string;
  birthdate?: string;
  avatar_url?: string;
  source?: ContactSource;
  status: ContactStatus;
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// --- Leads ---
export type EmploymentType = 'clt' | 'autonomous' | 'business_owner' | 'retired' | 'other';
export type MaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'other';
export type QualificationSource = 'ai_flow' | 'manual' | 'import' | 'form';
export type DeviceType = 'mobile' | 'desktop' | 'tablet';

export interface Lead {
  id: string;
  business_id: string;
  contact_id: string;           // FK to crm.contacts — required, NOT NULL
  contact?: Contact;            // joined from crm.contacts

  // Socioeconomic (qualification detail — NOT in contacts)
  occupation?: string;
  employer?: string;
  employment_type?: EmploymentType;
  monthly_income?: number;
  marital_status?: MaritalStatus;
  dependents_count?: number;

  // CRM
  stage: PipelineStage;         // position in the pipeline
  score: number;                // 0–100
  assigned_to?: BusinessMember; // joined from core.business_members + core.users
  tags: string[];
  qualification_source?: QualificationSource;
  disqualification_reason?: string;
  notes?: string;

  // Tracking
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  ip_city?: string;
  ip_state?: string;
  device_type?: DeviceType;

  // Timestamps
  created_at: string;
  updated_at?: string;
  last_contact_at?: string;
  qualified_at?: string;

  // Joined: real_estate.lead_profiles (optional, only for real_estate segment)
  real_estate_profile?: LeadRealEstateProfile;
}

// --- Real Estate Lead Profile (real_estate.lead_profiles) ---
export type PurchaseIntent = 'buy' | 'rent' | 'invest';
export type PurchaseTimeline = 'immediate' | 'within_3m' | 'within_6m' | 'within_12m' | 'exploring';
export type CurrentHousing = 'renting' | 'with_family' | 'owns_property' | 'other';
export type PropertyType = 'apartment' | 'house' | 'penthouse' | 'commercial' | 'land' | 'studio' | 'other';
export type PreferredContactTime = 'morning' | 'afternoon' | 'evening' | 'weekend' | 'anytime';
export type PreferredChannel = 'whatsapp' | 'phone' | 'email' | 'in_person';

export interface LeadRealEstateProfile {
  lead_id: string;
  purchase_intent?: PurchaseIntent;
  purchase_timeline?: PurchaseTimeline;
  current_housing?: CurrentHousing;
  property_types?: PropertyType[];
  bedrooms_min?: number;
  bedrooms_max?: number;
  budget_min?: number;
  budget_max?: number;
  desired_neighborhoods?: string[];
  interest_notes?: string;       // free text fallback for property interest
  financing_pre_approved?: boolean;
  fgts_available?: boolean;
  fgts_amount?: number;
  has_property_to_sell?: boolean;
  preferred_contact_time?: PreferredContactTime;
  preferred_channel?: PreferredChannel;
  created_at?: string;
  updated_at?: string;
}

// --- Properties (real_estate.properties) ---
export type PropertyStatus = 'available' | 'reserved' | 'sold' | 'rented' | 'inactive';
export type ExternalSource = 'vivareal' | 'zapimoveis' | 'olx' | 'manual' | 'import' | 'api';

export interface Property {
  id: string;
  business_id: string;
  title: string;
  description?: string;
  type: PropertyType;
  status: PropertyStatus;
  address?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  latitude?: number;
  longitude?: number;
  area_m2?: number;
  bedrooms?: number;
  bathrooms?: number;
  parking_spots?: number;
  floor_number?: number;
  total_floors?: number;
  sale_price?: number;
  rental_price?: number;
  condo_fee?: number;
  iptu_annual?: number;
  photos?: string[];
  amenities?: string[];
  external_id?: string;
  external_source?: ExternalSource;
  created_at: string;
  updated_at?: string;
}

// --- Pipeline ---
export type PipelineStage =
  | 'new_lead'
  | 'contact_initiated'
  | 'visit_scheduled'
  | 'proposal'
  | 'negotiation'
  | 'won'
  | 'lost';

export interface PipelineColumn {
  id: PipelineStage;
  label: string;
  color: string;
  leads: Lead[];
}

// --- Chat / Messaging ---
export type MessageSenderType = 'lead' | 'agent' | 'ai' | 'system';
export type ConversationStatus = 'new' | 'open' | 'pending' | 'resolved';
export type ConversationChannel = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok' | 'email';
export type MediaType = 'image' | 'video' | 'audio' | 'document' | 'location';

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: MessageSenderType;
  sender_id?: string;
  content: string;
  media_url?: string;
  media_type?: MediaType;
  is_ai_suggestion?: boolean;
  read: boolean;
  external_id?: string;
  created_at: string;
}

export type ConversationAiMode = 'manual' | 'assisted' | 'agent';

export interface Conversation {
  id: string;
  business_id: string;
  lead: Lead;                   // joined
  status: ConversationStatus;
  channel: ConversationChannel;
  assigned_to?: BusinessMember; // joined
  messages: Message[];          // joined from messaging.messages
  unread_count: number;
  tags: string[];
  ai_mode: ConversationAiMode;
  ai_insight?: string;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

// --- Campaigns ---
export type CampaignChannel = 'whatsapp' | 'instagram' | 'facebook' | 'tiktok';
export type CampaignType = 'broadcast' | 'social_post' | 'drip';
export type CampaignStatus = 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'failed';

export interface Campaign {
  id: string;
  business_id: string;
  name: string;
  type: CampaignType;
  channel: CampaignChannel;
  status: CampaignStatus;
  content?: string;
  audience_count: number;
  sent_count?: number;
  opened_count?: number;
  clicked_count?: number;
  scheduled_at?: string;
  sent_at?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// --- Agenda / Scheduling ---
export type EventType = 'visit' | 'call' | 'follow_up' | 'meeting' | 'other';

export interface AgendaEvent {
  id: string;
  business_id: string;
  title: string;
  type: EventType;
  lead?: Lead;                  // joined
  assigned_to: BusinessMember;  // joined
  property_id?: string;
  start_at: string;
  end_at: string;
  notes?: string;
  location?: string;
  confirmed: boolean;
  reminder_sent?: boolean;
  created_at?: string;
  updated_at?: string;
}

// --- AI ---
export type AiInsightType = 'alert' | 'opportunity' | 'info' | 'suggestion';

export interface AiInsight {
  id: string;
  business_id: string;
  lead_id?: string;
  type: AiInsightType;
  title: string;
  description: string;
  action_label?: string;
  action_url?: string;
  is_read: boolean;
  is_dismissed: boolean;
  metadata?: Record<string, unknown>;
  created_at: string;
}

// --- Analytics ---
export interface DailyMetric {
  date: string;
  value: number;
}

export interface AnalyticsSummary {
  total_leads: number;
  leads_this_month: number;
  leads_growth: number;          // percentage
  conversion_rate: number;
  conversion_growth: number;
  avg_response_time: string;     // "2h 14m"
  won_deals: number;
  won_value: number;             // R$
  lost_deals: number;
  leads_by_source: { source: LeadSource; count: number }[];
  leads_by_stage: { stage: PipelineStage; count: number }[];
  leads_over_time: DailyMetric[];
  conversions_over_time: DailyMetric[];
}

// --- App Context ---
export interface AppState {
  user: User | null;
  business: Business | null;
  segment: Segment;
  locale: Locale;
  sidebar_collapsed: boolean;
  ai_panel_open: boolean;
}
