import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const BASE = 'http://127.0.0.1:3001/api/asistencia';

@Injectable({ providedIn: 'root' })
export class AsistenciaService {
  constructor(private http: HttpClient) {}

  // Sesiones
  crearSesion(dto: any) { return this.http.post(`${BASE}/sesiones`, dto); }
  getSesion(id: string | number) { return this.http.get(`${BASE}/sesiones/${id}`); }
  getSesionesByHorario(horarioId: string | number) { return this.http.get(`${BASE}/sesiones/horario/${horarioId}`); }
  getSesionActivaByHorario(horarioId: string | number) { return this.http.get(`${BASE}/sesiones/horario/${horarioId}/activa`); }
  updateSesion(id: string | number, dto: any) { return this.http.put(`${BASE}/sesiones/${id}`, dto); }
  cerrarSesion(id: string | number) { return this.http.patch(`${BASE}/sesiones/${id}/cerrar`, {}); }

  // Registros / Firmas
  verificarRostro(dto: any) { return this.http.post(`${BASE}/registros/verificar-rostro`, dto); }
  registrarFirma(dto: any) { return this.http.post(`${BASE}/registros/firma`, dto); }
  marcarFallaJustificada(dto: any) { return this.http.patch(`${BASE}/registros/falla-justificada`, dto); }
  getPendientes(sesionId: string | number) { return this.http.get(`${BASE}/sesiones/${sesionId}/pendientes`); }

  // SSE para firmas en tiempo real
  connectStream(sesionId: number): EventSource {
    return new EventSource(`${BASE}/sesiones/${sesionId}/stream`, { withCredentials: false });
  }

  // Historial / Consultas
  getHistorial(fecha?: string, fichaId?: string, instructorId?: string) {
    let url = `${BASE}/historial`;
    const params: string[] = [];
    if (fecha) params.push(`fecha=${fecha}`);
    if (fichaId) params.push(`fichaId=${fichaId}`);
    if (instructorId) params.push(`instructorId=${instructorId}`);
    if (params.length) url += '?' + params.join('&');
    return this.http.get(url);
  }

  getSesionesActivasInstructor(instructorId: string | number) {
    return this.http.get(`${BASE}/instructor/${instructorId}/activas`);
  }

  getSesionActivaByFicha(fichaId: string | number) {
    return this.http.get(`${BASE}/ficha/${fichaId}/activa`);
  }

  getReporteMensual(fichaId: string | number, anio: number, mes: number) {
    return this.http.get(`${BASE}/ficha/${fichaId}/reporte-mensual?anio=${anio}&mes=${mes}`);
  }
}
