import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateFriendRequestDto } from './dto/create-friend-request.dto';
import { FriendsService } from './friends.service';

@Controller('friends')
@UseGuards(JwtAuthGuard)
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Get()
  listFriends(@Request() req: FastifyRequest) {
    return this.friendsService.listFriends(req.user!.id);
  }

  @Get('requests')
  listRequests(@Request() req: FastifyRequest) {
    return this.friendsService.listRequests(req.user!.id);
  }

  @Get('blocked')
  listBlockedUsers(@Request() req: FastifyRequest) {
    return this.friendsService.listBlockedUsers(req.user!.id);
  }

  @Get('search')
  searchUsers(
    @Request() req: FastifyRequest,
    @Query('q') query = '',
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? parseInt(limit, 10) : undefined;
    return this.friendsService.searchUsers(req.user!.id, query, parsedLimit);
  }

  @Post('requests')
  sendRequest(@Request() req: FastifyRequest, @Body() dto: CreateFriendRequestDto) {
    return this.friendsService.sendRequest(req.user!.id, dto.friendId);
  }

  @Post('requests/:requestId/accept')
  acceptRequest(@Request() req: FastifyRequest, @Param('requestId') requestId: string) {
    return this.friendsService.acceptRequest(req.user!.id, requestId);
  }

  @Post('requests/:requestId/reject')
  rejectRequest(@Request() req: FastifyRequest, @Param('requestId') requestId: string) {
    return this.friendsService.rejectRequest(req.user!.id, requestId);
  }

  @Delete(':friendId')
  removeFriend(@Request() req: FastifyRequest, @Param('friendId') friendId: string) {
    return this.friendsService.removeFriend(req.user!.id, friendId);
  }

  @Post(':friendId/block')
  blockUser(@Request() req: FastifyRequest, @Param('friendId') friendId: string) {
    return this.friendsService.blockUser(req.user!.id, friendId);
  }

  @Delete(':friendId/block')
  unblockUser(@Request() req: FastifyRequest, @Param('friendId') friendId: string) {
    return this.friendsService.unblockUser(req.user!.id, friendId);
  }

  @Get(':friendId/practice-stats')
  getFriendPracticeStats(@Request() req: FastifyRequest, @Param('friendId') friendId: string) {
    return this.friendsService.getFriendPracticeStats(req.user!.id, friendId);
  }

  @Post('presence/ping')
  pingPresence(@Request() req: FastifyRequest) {
    return this.friendsService.pingPresence(req.user!.id);
  }
}
