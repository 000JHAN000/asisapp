import { PartialType } from '@nestjs/mapped-types';
import { CreateConfiguracionAsistenciaDto } from './create-configuracion-asistencia.dto';

export class UpdateConfiguracionAsistenciaDto extends PartialType(CreateConfiguracionAsistenciaDto) {}
