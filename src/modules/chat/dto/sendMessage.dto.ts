import { IsString, IsNotEmpty} from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
        @IsString({ message: 'message must be string' }) // Ensure that the message is a string
    @IsNotEmpty({ message: 'message is required' }) // Ensure that the message is not empty


    message!: string;
}