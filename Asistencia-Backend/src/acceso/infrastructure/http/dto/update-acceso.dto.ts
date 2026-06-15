// infrastructure/http/dto/update-acceso.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateAccesoDto } from './create-acceso.dto';

export class UpdateAccesoDto extends PartialType(CreateAccesoDto) {}