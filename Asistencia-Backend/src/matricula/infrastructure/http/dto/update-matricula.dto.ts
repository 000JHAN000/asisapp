// infrastructure/http/dto/update-matricula.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateMatriculaDto } from './create-matricula.dto';

export class UpdateMatriculaDto extends PartialType(CreateMatriculaDto) {}