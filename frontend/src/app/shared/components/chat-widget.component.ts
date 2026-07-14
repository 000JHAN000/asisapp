import { Component, signal, computed } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { AuthService } from '../../core/services/auth.service';
import { ChatWidgetService } from '../../core/services/chat-widget.service';

interface ChatMessage {
  from: 'bot' | 'user';
  text: string;
}

const WHATSAPP_NUMBER = '573228538033';

@Component({
  selector: 'app-chat-widget',
  imports: [LucideAngularModule, FormsModule],
  template: `
    @if (open()) {
      <div class="chat-panel">
        <div class="chat-header">
          <div class="chat-header-info">
            <div class="chat-header-icon"><lucide-icon name="message-square" [size]="18"></lucide-icon></div>
            <div>
              <div class="chat-header-title">Asistente AsisApp</div>
              <div class="chat-header-sub">Consulta tu asistencia</div>
            </div>
          </div>
          <button class="chat-close-btn" (click)="toggle()" aria-label="Cerrar">
            <lucide-icon name="x" [size]="18"></lucide-icon>
          </button>
        </div>

        <div class="chat-body">
          @for (m of mensajes(); track $index) {
            <div class="chat-bubble" [class.chat-bubble-user]="m.from === 'user'" [class.chat-bubble-bot]="m.from === 'bot'">
              {{ m.text }}
            </div>
          }
          @if (loading()) {
            <div class="chat-bubble chat-bubble-bot chat-typing">
              <span></span><span></span><span></span>
            </div>
          }
          @if (mostrarAccionesRapidas()) {
            <div class="chat-quick-actions">
              <button class="chat-quick-btn" (click)="consultarAsistencia()">
                <lucide-icon name="clipboard-list" [size]="14"></lucide-icon>
                Consultar mi asistencia
              </button>
              <a class="chat-quick-btn chat-quick-whatsapp" [href]="whatsappLink" target="_blank" rel="noopener">
                <lucide-icon name="phone" [size]="14"></lucide-icon>
                Hablar por WhatsApp
              </a>
            </div>
          }
        </div>

        <form class="chat-input-row" (submit)="enviar($event)">
          <input
            class="chat-input"
            type="text"
            placeholder="Escribe tu mensaje..."
            [(ngModel)]="textoInput"
            name="mensaje"
            [disabled]="loading()"
            autocomplete="off"
          >
          <button class="chat-send-btn" type="submit" [disabled]="loading() || !textoInput.trim()" aria-label="Enviar">
            <lucide-icon name="send" [size]="16"></lucide-icon>
          </button>
        </form>
        <p class="chat-disclaimer">
          Asistente automatizado — puede no tener siempre información exacta.
          Para algo urgente, escríbenos por
          <a [href]="whatsappLink" target="_blank" rel="noopener">WhatsApp</a>.
        </p>
      </div>
    }

    <button class="chat-fab" (click)="toggle()" [attr.aria-label]="open() ? 'Cerrar chat' : 'Abrir chat'">
      <lucide-icon [name]="open() ? 'x' : 'message-square'" [size]="24"></lucide-icon>
    </button>
  `,
  styles: [`
    .chat-fab {
      position: fixed; bottom: 24px; right: 24px; z-index: 9998;
      width: 56px; height: 56px; border-radius: 50%;
      background: var(--blue); color: #fff; border: none;
      display: flex; align-items: center; justify-content: center;
      box-shadow: var(--shadow-lg); cursor: pointer;
      transition: transform .15s;
    }
    .chat-fab:hover { transform: scale(1.06); }

    .chat-panel {
      position: fixed; bottom: 90px; right: 24px; z-index: 9998;
      width: min(360px, calc(100vw - 32px));
      max-height: min(560px, calc(100vh - 140px));
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px; box-shadow: var(--shadow-lg);
      display: flex; flex-direction: column; overflow: hidden;
    }

    .chat-header {
      background: var(--blue); color: #fff;
      padding: 14px 16px; display: flex; align-items: center; justify-content: space-between;
      flex-shrink: 0;
    }
    .chat-header-info { display: flex; align-items: center; gap: 10px; }
    .chat-header-icon {
      width: 32px; height: 32px; border-radius: 50%; background: rgba(255,255,255,.15);
      display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    }
    .chat-header-title { font-size: 14px; font-weight: 700; }
    .chat-header-sub { font-size: 11px; opacity: .85; }
    .chat-close-btn {
      background: none; border: none; color: #fff; cursor: pointer;
      display: flex; align-items: center; justify-content: center; opacity: .9;
    }
    .chat-close-btn:hover { opacity: 1; }

    .chat-body {
      flex: 1; overflow-y: auto; padding: 16px; background: var(--bg);
      display: flex; flex-direction: column; gap: 10px;
    }
    .chat-bubble {
      max-width: 85%; padding: 9px 13px; border-radius: 12px; font-size: 13px; line-height: 1.4;
      white-space: pre-wrap; word-break: break-word;
    }
    .chat-bubble-bot { align-self: flex-start; background: var(--surface2); color: var(--text); border-bottom-left-radius: 4px; }
    .chat-bubble-user { align-self: flex-end; background: var(--blue); color: #fff; border-bottom-right-radius: 4px; }

    .chat-typing { display: flex; gap: 4px; align-items: center; padding: 12px 14px; }
    .chat-typing span {
      width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted);
      animation: chat-typing-bounce 1s infinite ease-in-out;
    }
    .chat-typing span:nth-child(2) { animation-delay: .15s; }
    .chat-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes chat-typing-bounce { 0%, 60%, 100% { transform: translateY(0); opacity: .5; } 30% { transform: translateY(-3px); opacity: 1; } }

    .chat-quick-actions { display: flex; flex-direction: column; gap: 8px; margin-top: 4px; }
    .chat-quick-btn {
      display: flex; align-items: center; gap: 8px; padding: 9px 14px;
      border-radius: 20px; border: 1px solid var(--blue); background: var(--surface);
      color: var(--blue); font-size: 12.5px; font-weight: 600; cursor: pointer;
      text-decoration: none; justify-content: center;
    }
    .chat-quick-btn:hover { background: var(--blue); color: #fff; }
    .chat-quick-whatsapp { border-color: var(--green); color: var(--green); }
    .chat-quick-whatsapp:hover { background: var(--green); color: #fff; }

    .chat-input-row {
      flex-shrink: 0; display: flex; gap: 8px; padding: 10px 12px;
      border-top: 1px solid var(--border); background: var(--surface);
    }
    .chat-input {
      flex: 1; padding: 8px 12px; border-radius: 20px; border: 1px solid var(--border);
      background: var(--bg); color: var(--text); font-size: 13px; outline: none;
    }
    .chat-input:focus { border-color: var(--blue); }
    .chat-send-btn {
      width: 34px; height: 34px; border-radius: 50%; border: none; background: var(--blue);
      color: #fff; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0;
    }
    .chat-send-btn:disabled { opacity: .5; cursor: not-allowed; }

    .chat-disclaimer {
      flex-shrink: 0; font-size: 10.5px; color: var(--text-muted); text-align: center;
      padding: 6px 12px 10px; margin: 0; background: var(--surface);
    }
    .chat-disclaimer a { color: var(--blue); }
  `],
})
export class ChatWidgetComponent {
  open = signal(false);
  mensajes = signal<ChatMessage[]>([]);
  loading = signal(false);
  textoInput = '';

  readonly whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}`;

  mostrarAccionesRapidas = computed(() => this.mensajes().length <= 1 && !this.loading());

  constructor(private auth: AuthService, private chat: ChatWidgetService) {}

  toggle() {
    this.open.update((v) => !v);
    if (this.open() && this.mensajes().length === 0) {
      this.mensajes.set([
        { from: 'bot', text: '¡Hola! 👋 Soy el asistente de AsisApp. Puedo ayudarte a consultar tu asistencia. ¿Qué necesitas?' },
      ]);
    }
  }

  consultarAsistencia() {
    this.enviarMensajeInterno('Quiero consultar mi asistencia');
  }

  enviar(event: Event) {
    event.preventDefault();
    const texto = this.textoInput.trim();
    if (!texto) return;
    this.textoInput = '';
    this.enviarMensajeInterno(texto);
  }

  private enviarMensajeInterno(texto: string) {
    this.mensajes.update((m) => [...m, { from: 'user', text: texto }]);
    this.loading.set(true);
    const user = this.auth.currentUser();
    this.chat.enviarMensaje({
      perfilId: user?.perfilId ?? null,
      rol: user?.rol,
      tenantSlug: user?.tenantSlug ?? null,
      mensaje: texto,
    }).subscribe({
      next: (res) => {
        this.mensajes.update((m) => [...m, { from: 'bot', text: res.respuesta }]);
        this.loading.set(false);
      },
      error: () => {
        this.mensajes.update((m) => [...m, {
          from: 'bot',
          text: 'No pude procesar tu mensaje en este momento. Intenta de nuevo o escríbenos por WhatsApp.',
        }]);
        this.loading.set(false);
      },
    });
  }
}
