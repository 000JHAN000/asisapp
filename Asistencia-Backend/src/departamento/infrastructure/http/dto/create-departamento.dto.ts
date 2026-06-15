import { IsString, MinLength} from "class-validator";

export class CreateDepartamentoDto {
    @IsString()
    @MinLength(3)
    nombre:string;
}
