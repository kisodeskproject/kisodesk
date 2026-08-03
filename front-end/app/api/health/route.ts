// app/api/health/route.ts
// Endpoint para verificar que la API está funcionando

export async function GET() {
  return Response.json({ status: 'ok' });
}
