export interface User {
  id: number;
  name: string;
  email: string;
  phno?: string;
}

export interface College {
  'S.No': number;
  inst_name: string;
  State: string;
  District: string;
  Course: string;
  Category: string;
  Rating: number;
  'Placement %': number;
  ALP: number;
  Infra: number | string;
  Faculty: number | string;
  Fees: string;
  Links: string;
  Comments?: string;
  established?: number;
  highlights?: string[];
}

export interface SearchQuery {
  id: number;
  query_text: string;
  timestamp: string;
  resultsCount: number;
  result_colleges: string;
  created_at?: string;
}

export interface SearchFilters {
  courseType?: string;
  location?: string;
  ratingFilter?: string;
  department?: string[];
  rating?: number;
  state?: string;
  district?: string;
}

export interface SearchResponse {
  success: boolean;
  html?: string;
  colleges?: College[];
  message?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  message?: string;
  error?: string;
}

export interface VoiceRecognitionState {
  isListening: boolean;
  isSupported: boolean;
  error?: string;
}