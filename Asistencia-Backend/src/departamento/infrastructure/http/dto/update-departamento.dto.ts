// infrastructure/http/dto/update-departamento.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateDepartamentoDto } from './create-departamento.dto';

export class UpdateDepartamentoDto extends PartialType(CreateDepartamentoDto) {}