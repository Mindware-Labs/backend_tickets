// DTOs para los webhooks de Aircall
// Documentación: https://developer.aircall.io/api-references/#webhooks

export interface AircallWebhookPayload {
  event: string; // "call.created", "call.answered", "call.ended", etc.
  timestamp: number; // Unix timestamp
  token: string; // Token del webhook
  data: AircallCallData;
}

export interface AircallCallData {
  id: number;
  direct_link: string;
  status: string; // "initial", "answered", "done"
  direction: string; // "inbound", "outbound"
  started_at: number; // Unix timestamp
  answered_at?: number;
  ended_at?: number;
  duration?: number; // en segundos
  missed_call_reason?: string; // "out_of_opening_hours", "short_abandoned", etc.
  raw_digits?: string;
  recording?: string; // URL de la grabación
  voicemail?: string; // URL del voicemail
  user?: {
    id: number;
    name: string;
    email: string;
  };
  contact?: {
    id: number;
    first_name?: string;
    last_name?: string;
    company_name?: string;
    information?: string;
    is_shared?: boolean;
    created_at?: number;
    updated_at?: number;
    phone_numbers?: Array<{
      id: number;
      value: string;
      label?: string;
    }>;
    emails?: Array<{
      id?: number;
      value: string;
      label?: string;
    }>;
  };
  number?: {
    id: number;
    name: string;
    digits: string;
  };
  assigned_to?: {
    id: number;
    name: string;
  };
  // Números de teléfono
  from?: string;
  to?: string;
  // Información adicional
  tags?: Array<{
    id: number;
    name: string;
  }>;
  comments?: Array<{
    id: number;
    content: string;
  }>;
}

export class AircallWebhookDto {
  event: string;
  timestamp: number;
  token: string;
  data: AircallCallData;
}
