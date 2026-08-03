import { IsString, IsUUID } from 'class-validator';

export class CreateFriendRequestDto {
  @IsString()
  @IsUUID()
  friendId!: string;
}
