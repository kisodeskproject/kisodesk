import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';

@Injectable()
export class RolesService {
  findAll() {
    // Devuelve los valores del enum Role como lista de objetos
    const roles = Object.values(Role).map((role) => ({
      id: role,
      name: role,
    }));
    return roles;
  }
}
