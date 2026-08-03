// src/ranking/ranking.controller.ts
import { Controller, Get, Query, UseGuards, Req, UnauthorizedException } from '@nestjs/common';

import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RankingQueryDto } from './dto/ranking-query.dto';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  @Get()
  async getRanking(@Query() query: RankingQueryDto) {
    return this.rankingService.getRanking(query.language, query.limit, query.offset);
  }

  @Get('user-stats')
  @UseGuards(JwtAuthGuard)
  async getUserStats(@Req() req: any, @Query() query: RankingQueryDto) {
    const userId = req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('User not authenticated');
    }
    return this.rankingService.getUserStats(userId, query.language);
  }
}
