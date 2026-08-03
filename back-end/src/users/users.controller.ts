// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Role, LanguageCode } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';

import { CreateUserDto } from './dto/create-user.dto';
import { DeleteMeDto } from './dto/delete-me.dto';
import { UpdateMeDto } from './dto/update-me.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  ACCESS_TOKEN_COOKIE_PATH,
  getAuthCookieDomain,
  REFRESH_TOKEN_COOKIE_PATH,
} from '../auth/auth-session.config';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Usuario autenticado
  @Get('me/export')
  @UseGuards(JwtAuthGuard)
  async exportMe(@Request() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const exportData = await this.usersService.exportMyData(req.user.id);
    const date = new Date().toISOString().slice(0, 10);
    res.header('Content-Disposition', `attachment; filename="account-data-${date}.json"`);
    res.header('Content-Type', 'application/json; charset=utf-8');
    res.header('Cache-Control', 'private, no-store');
    return exportData;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: FastifyRequest) {
    return this.usersService.getUserProfile(req.user.id);
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  updateMe(@Request() req: FastifyRequest, @Body() dto: UpdateMeDto) {
    return this.usersService.updateMe(req.user.id, dto);
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @Throttle({ auth: { limit: 3, ttl: 15 * 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMe(
    @Request() req: FastifyRequest,
    @Body() dto: DeleteMeDto,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.usersService.removeMe(req.user.id, dto, req.user.authTime);
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: ACCESS_TOKEN_COOKIE_PATH,
      domain: getAuthCookieDomain(),
    });
    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: REFRESH_TOKEN_COOKIE_PATH,
      domain: getAuthCookieDomain(),
    });
  }

  @Get('me/progress')
  @UseGuards(JwtAuthGuard)
  getMyProgress(@Request() req: FastifyRequest) {
    return this.usersService.getProgress(req.user.id);
  }

  @Get('me/heatmap')
  @UseGuards(JwtAuthGuard)
  getMyHeatmap(@Request() req: FastifyRequest) {
    return this.usersService.getHeatmap(req.user.id);
  }

  @Get('me/weak-keys')
  @UseGuards(JwtAuthGuard)
  async getWeakKeys(
    @Request() req: FastifyRequest,
    @Query('language') language?: LanguageCode,
    @Query('locale') locale?: string,
    @Query('limit', new DefaultValuePipe(5), ParseIntPipe) limit?: number,
    @Query('days', new DefaultValuePipe(null), new ParseIntPipe({ optional: true })) days?: number,
  ) {
    const userId = req.user.id;
    return this.usersService.getWeakKeys(userId, language, limit, days, locale);
  }

  // Administrador endpoints
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
