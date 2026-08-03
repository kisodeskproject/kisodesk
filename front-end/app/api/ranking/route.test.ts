/** @jest-environment node */

import { describe, expect, it, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

import { GET } from './route';

describe('ranking proxy', () => {
  it('uses global as the default scope', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ranking: [] }), { status: 200 }),
    );

    await GET(new NextRequest('http://localhost/api/ranking'));

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/v1/ranking?language=global&limit=20&offset=0'),
      expect.any(Object),
    );
    fetchMock.mockRestore();
  });
});
