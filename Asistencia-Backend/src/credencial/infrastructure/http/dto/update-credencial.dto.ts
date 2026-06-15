// infrastructure/http/dto/update-credencial.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateCredencialDto } from './create-credencial.dto';

export class UpdateCredencialDto extends PartialType(CreateCredencialDto) {}