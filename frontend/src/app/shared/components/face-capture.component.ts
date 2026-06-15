import { Component, signal, viewChild, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-face-capture',
  imports: [LucideAngularModule],
  template: `
    <div class="face-capture-wrap">
      <div class="video-container">
        <video
          #videoEl
          class="face-video"
          autoplay
          playsinline
          muted
          [class.mirror]="useFrontCamera()"
        ></video>
        <canvas #canvasOverlay class="face-overlay"></canvas>
        <div class="oval-guide"></div>
        <div class="corner-tl"></div>
        <div class="corner-tr"></div>
        <div class="corner-bl"></div>
        <div class="corner-br"></div>
      </div>

      <div class="instructions">
        @if (error()) {
          <p class="error-text">{{ error() }}</p>
        } @else if (loading()) {
          <p class="loading-text"><span class="spin">⟳</span> Iniciando cámara...</p>
        } @else {
          <p class="instruction-text">
            <lucide-icon name="scan-face" [size]="16"></lucide-icon>
            {{ instruction() }}
          </p>
        }
      </div>

      <div class="actions">
        <button
          class="btn btn-blue btn-lg"
          [disabled]="loading() || !!error() || capturing()"
          (click)="capture()">
          @if (capturing()) {
            <span class="spin">⟳</span> Procesando...
          } @else {
            <lucide-icon name="camera" [size]="18"></lucide-icon>
            Capturar Rostro
          }
        </button>
      </div>
    </div>
  `,
  styles: [`
    .face-capture-wrap { display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .video-container { position: relative; width: 320px; height: 400px; border-radius: 16px; overflow: hidden; background: #0f172a; }
    .face-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
    .face-video.mirror { transform: scaleX(-1); }
    .face-overlay { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
    .oval-guide {
      position: absolute; top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 200px; height: 260px;
      border: 3px dashed rgba(255,255,255,0.6);
      border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
      pointer-events: none;
      box-shadow: 0 0 0 9999px rgba(0,0,0,0.45);
    }
    .corner-tl, .corner-tr, .corner-bl, .corner-br {
      position: absolute; width: 24px; height: 24px; border-color: #3b82f6; border-style: solid; pointer-events: none;
    }
    .corner-tl { top: 16px; left: 16px; border-width: 3px 0 0 3px; border-top-left-radius: 12px; }
    .corner-tr { top: 16px; right: 16px; border-width: 3px 3px 0 0; border-top-right-radius: 12px; }
    .corner-bl { bottom: 16px; left: 16px; border-width: 0 0 3px 3px; border-bottom-left-radius: 12px; }
    .corner-br { bottom: 16px; right: 16px; border-width: 0 3px 3px 0; border-bottom-right-radius: 12px; }
    .instructions { text-align: center; min-height: 24px; }
    .instruction-text { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: var(--text-muted); margin: 0; }
    .error-text { color: #dc2626; font-size: 13px; font-weight: 600; margin: 0; }
    .loading-text { display: flex; align-items: center; justify-content: center; gap: 6px; font-size: 13px; color: var(--text-muted); margin: 0; }
    .actions { display: flex; gap: 10px; }
    .btn { display: inline-flex; align-items: center; gap: 6px; padding: 10px 20px; border-radius: 10px; font-size: 14px; font-weight: 700; cursor: pointer; border: 1px solid transparent; transition: opacity .15s; }
    .btn-blue { background: var(--blue); color: #fff; }
    .btn-lg { padding: 12px 28px; font-size: 15px; }
    .btn:disabled { opacity: .5; cursor: not-allowed; }
    .spin { display: inline-block; animation: spin 1s linear infinite; }
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `],
})
export class FaceCaptureComponent implements OnDestroy {
  private videoRef = viewChild<ElementRef<HTMLVideoElement>>('videoEl');
  private overlayRef = viewChild<ElementRef<HTMLCanvasElement>>('canvasOverlay');

  @Output() captured = new EventEmitter<string>();

  loading = signal(true);
  capturing = signal(false);
  error = signal<string | null>(null);
  useFrontCamera = signal(true);
  instruction = signal('Centra tu rostro dentro del óvalo y presiona Capturar');

  private stream: MediaStream | null = null;

  constructor() {
    this.startCamera();
  }

  ngOnDestroy() {
    this.stopCamera();
  }

  private async startCamera() {
    this.loading.set(true);
    this.error.set(null);
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: this.useFrontCamera() ? 'user' : 'environment', width: 640, height: 480 },
        audio: false,
      });
      const video = this.videoRef()?.nativeElement;
      if (video) {
        video.srcObject = this.stream;
        await video.play();
      }
      this.loading.set(false);
      this.instruction.set('Centra tu rostro dentro del óvalo y presiona Capturar');
    } catch (err: any) {
      this.loading.set(false);
      this.error.set('No se pudo acceder a la cámara. Asegúrate de dar permisos.');
      console.error('Camera error:', err);
    }
  }

  private stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
  }

  capture() {
    const video = this.videoRef()?.nativeElement;
    if (!video) return;
    this.capturing.set(true);

    // Crear canvas para capturar el frame
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = video.videoWidth || 640;
    captureCanvas.height = video.videoHeight || 480;
    const ctx = captureCanvas.getContext('2d');
    if (!ctx) {
      this.capturing.set(false);
      return;
    }

    // Si es cámara frontal, espejar horizontalmente para que coincida con lo que ve el usuario
    if (this.useFrontCamera()) {
      ctx.translate(captureCanvas.width, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, captureCanvas.width, captureCanvas.height);

    // Recortar al área del óvalo (centro de la imagen)
    const cropWidth = Math.round(captureCanvas.width * 0.55);
    const cropHeight = Math.round(captureCanvas.height * 0.70);
    const cropX = Math.round((captureCanvas.width - cropWidth) / 2);
    const cropY = Math.round((captureCanvas.height - cropHeight) / 2);

    const cropCanvas = document.createElement('canvas');
    cropCanvas.width = cropWidth;
    cropCanvas.height = cropHeight;
    const cropCtx = cropCanvas.getContext('2d');
    if (!cropCtx) {
      this.capturing.set(false);
      return;
    }
    cropCtx.drawImage(captureCanvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    // Convertir a Base64 JPEG (calidad 0.92)
    const base64 = cropCanvas.toDataURL('image/jpeg', 0.92);
    this.capturing.set(false);
    this.captured.emit(base64);
  }
}
