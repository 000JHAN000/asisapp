import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';

const N8N_WEBHOOK_URL = 'https://n8n-production-14bfb.up.railway.app/webhook/029d2716-e1c0-49a7-b7f7-8e08749a2655';

export interface ChatWidgetRequest {
  perfilId?: string | null;
  rol?: string;
  tenantSlug?: string | null;
  mensaje: string;
}

export interface ChatWidgetResponse {
  respuesta: string;
}

@Injectable({ providedIn: 'root' })
export class ChatWidgetService {
  constructor(private http: HttpClient) {}

  enviarMensaje(payload: ChatWidgetRequest): Observable<ChatWidgetResponse> {
    if (!N8N_WEBHOOK_URL) {
      return of({
        respuesta: 'Este asistente todavía se está configurando. Mientras tanto, escríbenos por WhatsApp y con gusto te ayudamos.',
      });
    }
    return this.http.post<ChatWidgetResponse>(N8N_WEBHOOK_URL, payload);
  }
}
