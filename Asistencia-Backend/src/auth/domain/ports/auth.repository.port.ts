// domain/ports/auth.repository.port.ts

export const AUTH_REPOSITORY = 'AUTH_REPOSITORY';

export interface AuthRepositoryPort {
  buscarCredencialPorLogin(login: string): Promise<{
    id_credencial: string;
    login:         string;
    password:      string;
    usuario_fk:    string;
    rol_fk:        string;
    persona_fk:    string;
    aplicativo_fk: string;
  } | null>;

  buscarPersonaPorId(personaId: string): Promise<{
  nombres: string;
  } | null>;

  guardarAcceso(datos: {
    token:      string;
    usuario_fk: string;
  }): Promise<void>;

  invalidarAcceso(token: string): Promise<void>;
}