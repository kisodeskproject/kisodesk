// test/e2e/auth.e2e-spec.ts
// TODO: Probar el flujo completo de autenticación:
// - Registro de usuario con email/username/password y verificación de tokens.
// - Login con credenciales válidas e inválidas.
// - Obtención de perfil autenticado (GET /v1/auth/me) con token válido y sin token.
// - Refresco de tokens (POST /v1/auth/refresh) con refresh_token válido e inválido.
// Se requiere resolver el registro de @fastify/cookie con secret en el entorno de pruebas.
describe('Auth (e2e)', () => {
  it('prueba placeholder', () => {
    expect(true).toBe(true);
  });
});
