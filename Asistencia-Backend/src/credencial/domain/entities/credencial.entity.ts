// domain/entities/credencial.entity.ts

export class Credencial {
  id_credencial: string;
  login:         string;
  password:      string;
  rol_fk:        string;
  usuario_fk:    string;
}