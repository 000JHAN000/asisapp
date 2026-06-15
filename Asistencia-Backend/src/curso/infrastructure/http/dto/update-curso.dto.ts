// infrastructure/http/dto/update-curso.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCursoDto } from './create-curso.dto';

export class UpdateCursoDto extends PartialType(CreateCursoDto) {}