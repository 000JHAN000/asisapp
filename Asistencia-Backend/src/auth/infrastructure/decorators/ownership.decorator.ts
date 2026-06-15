import { SetMetadata } from '@nestjs/common';

export const OWNERSHIP_KEY = 'ownership';

export interface OwnershipConfig {
  tabla:    string;  // nombre de la entidad ORM
  campo:    string;  // campo que referencia al usuario/persona
  tipo:     'usuario' | 'persona'; // qué comparar del token
}

export const CheckOwnership = (config: OwnershipConfig) =>
  SetMetadata(OWNERSHIP_KEY, config);