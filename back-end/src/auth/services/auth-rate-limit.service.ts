// src/auth/services/auth-rate-limit.service.ts
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { Socket } from 'net';

type RedisValue = string | number | null | RedisValue[];

interface AuthRateLimitOptions {
  limit: number;
  ttlMs: number;
  label: string;
}

@Injectable()
export class AuthRateLimitService {
  private readonly host: string;
  private readonly port: number;
  private readonly password?: string;
  private readonly keyPrefix = 'typing:auth-rate-limit';

  constructor(private readonly config: ConfigService) {
    this.host = this.config.getOrThrow<string>('REDIS_HOST');
    this.port = this.config.get<number>('REDIS_PORT', 6379);
    this.password = this.config.get<string>('REDIS_PASSWORD') || undefined;
  }

  async checkEmailLimit(email: string, options: AuthRateLimitOptions): Promise<void> {
    const cleanEmail = email.trim().toLowerCase();
    const emailHash = createHash('sha256').update(cleanEmail).digest('hex');
    const redisKey = `${this.keyPrefix}:${options.label}:email:${emailHash}`;

    const result = await this.increment(redisKey, options.ttlMs);

    if (result.totalHits > options.limit) {
      throw new HttpException(
        'Demasiados intentos. Intenta de nuevo más tarde.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private async increment(
    key: string,
    ttlMs: number,
  ): Promise<{ totalHits: number; ttlRemainingMs: number }> {
    const result = await this.redisCommand([
      'EVAL',
      RATE_LIMIT_SCRIPT,
      1,
      key,
      Math.max(1, Math.trunc(ttlMs)),
    ]);

    if (!Array.isArray(result) || result.length < 2) {
      throw new Error('Unexpected Redis auth rate limit response');
    }

    return {
      totalHits: Number(result[0]),
      ttlRemainingMs: Number(result[1]),
    };
  }

  private async redisCommand(args: Array<string | number>): Promise<RedisValue> {
    const socket = new Socket();
    const chunks: Buffer[] = [];

    return new Promise<RedisValue>((resolve, reject) => {
      let settled = false;
      let authenticated = !this.password;

      const finish = (error?: Error, value?: RedisValue) => {
        if (settled) return;
        settled = true;
        socket.destroy();

        if (error) reject(error);
        else resolve(value ?? null);
      };

      socket.setTimeout(500, () => {
        finish(new Error('Redis command timed out'));
      });

      socket.on('error', (error) => finish(error));

      socket.on('data', (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        const buffer = Buffer.concat(chunks);

        try {
          const parsed = parseRedisResponse(buffer, 0);

          if (parsed) {
            if (!authenticated) {
              authenticated = true;
              chunks.length = 0;
              socket.write(encodeRedisCommand(args));
              return;
            }

            finish(undefined, parsed.value);
          }
        } catch (error) {
          finish(error instanceof Error ? error : new Error(String(error)));
        }
      });

      socket.connect(this.port, this.host, () => {
        socket.write(
          this.password ? encodeRedisCommand(['AUTH', this.password]) : encodeRedisCommand(args),
        );
      });
    });
  }
}

const RATE_LIMIT_SCRIPT = `
local current = redis.call("INCR", KEYS[1])
local ttl = redis.call("PTTL", KEYS[1])
if ttl < 0 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return { current, ttl }
`;

function encodeRedisCommand(args: Array<string | number>): Buffer {
  const parts = [`*${args.length}\r\n`];

  for (const arg of args) {
    const value = String(arg);
    parts.push(`$${Buffer.byteLength(value)}\r\n${value}\r\n`);
  }

  return Buffer.from(parts.join(''));
}

function parseRedisResponse(
  buffer: Buffer,
  offset: number,
): { value: RedisValue; offset: number } | null {
  if (offset >= buffer.length) return null;

  const type = String.fromCharCode(buffer[offset]);
  const nextOffset = offset + 1;

  if (type === '+' || type === '-' || type === ':') {
    const line = readLine(buffer, nextOffset);
    if (!line) return null;
    if (type === '-') throw new Error(line.value);

    return {
      value: type === ':' ? Number(line.value) : line.value,
      offset: line.offset,
    };
  }

  if (type === '$') {
    const line = readLine(buffer, nextOffset);
    if (!line) return null;

    const length = Number(line.value);

    if (length === -1) {
      return { value: null, offset: line.offset };
    }

    const end = line.offset + length;

    if (buffer.length < end + 2) return null;

    return {
      value: buffer.subarray(line.offset, end).toString(),
      offset: end + 2,
    };
  }

  if (type === '*') {
    const line = readLine(buffer, nextOffset);
    if (!line) return null;

    const count = Number(line.value);

    if (count === -1) {
      return { value: null, offset: line.offset };
    }

    const values: RedisValue[] = [];
    let currentOffset = line.offset;

    for (let index = 0; index < count; index++) {
      const parsed = parseRedisResponse(buffer, currentOffset);

      if (!parsed) return null;

      values.push(parsed.value);
      currentOffset = parsed.offset;
    }

    return {
      value: values,
      offset: currentOffset,
    };
  }

  throw new Error(`Unsupported Redis response type: ${type}`);
}

function readLine(buffer: Buffer, offset: number): { value: string; offset: number } | null {
  const end = buffer.indexOf('\r\n', offset);

  if (end === -1) return null;

  return {
    value: buffer.subarray(offset, end).toString(),
    offset: end + 2,
  };
}
