import { IsString, IsNotEmpty} from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
        @IsString({ message: 'message must be string' }) // Asegurar que el mensaje sea un string
    @IsNotEmpty({ message: 'message is required' }) // Asegurar que el mensaje no esté vacío


    message!: string;
}