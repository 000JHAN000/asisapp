// infrastructure/http/dto/update-municipio.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateMunicipioDto } from './create-municipio.dto';

export class UpdateMunicipioDto extends PartialType(CreateMunicipioDto) {}