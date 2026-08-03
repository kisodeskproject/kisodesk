// src/auth/guards/optional-jwt-auth.guard.ts
import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any, context: ExecutionContext, status?: any) {
    // Si hay un usuario (autenticado), devolverlo
    if (user) return user;
    // En cualquier otro caso (error, no token, token inválido), devolver null
    return null;
  }
}
