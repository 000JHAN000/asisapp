// infrastructure/http/dto/update-programa.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateProgramaDto } from './create-programa.dto';

export class UpdateProgramaDto extends PartialType(CreateProgramaDto) {}