// infrastructure/http/dto/update-centro-formacion.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCentroFormacionDto } from './create-centro-formacion.dto';

export class UpdateCentroFormacionDto extends PartialType(CreateCentroFormacionDto) {}