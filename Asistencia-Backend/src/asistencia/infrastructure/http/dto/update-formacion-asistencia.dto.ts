import { PartialType } from '@nestjs/mapped-types';
import { CreateFormacionAsistenciaDto } from './create-formacion-asistencia.dto';

export class UpdateFormacionAsistenciaDto extends PartialType(CreateFormacionAsistenciaDto) {}
