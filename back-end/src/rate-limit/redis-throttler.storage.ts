import { Logger } from '@nestjs/common';
import { ThrottlerStorage, ThrottlerStorageService } from '@nestjs/throttler';
import { Socket } from 'net';

type RedisValue = string | number | null | RedisValue[];
type ThrottlerStorageRecord = { totalHits: number; timeToExpire: number };

interface RedisThrottlerStorageOptions {
  host: string;
  port: number;
  password?: string;
  commandTimeoutMs?: number;
  keyPrefix?: string;
}

class RedisCommandClient {
  constructor(private readonly options: Required<RedisThrottlerStorageOptions>) {}

  async command(args: Array<string | number>): Promise<RedisValue> {
    const socket = new Socket();
    const chunks: Buffer[] = [];

    return new Promise<RedisValue>((resolve, reject) => {
      let settled = false;
      let authenticated = !this.options.password;

      const finish = (error?: Error, value?: RedisValue) => {
        if (settled) return;
        settled = true;
        socket.destroy();
        if (error) reject(error);
        else resolve(value ?? null);
      };

      socket.setTimeout(this.options.commandTimeoutMs, () => {
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

      socket.connect(this.options.port, this.options.host, () => {
        socket.write(
          this.options.password
            ? encodeRedisCommand(['AUTH', this.options.password])
            : encodeRedisCommand(args),
        );
      });
    });
  }
}

export class RedisThrottlerStorage implements ThrottlerStorage {
  private readonly logger = new Logger(RedisThrottlerStorage.name);
  private readonly client: RedisCommandClient;
  private readonly fallback = new ThrottlerStorageService();
  private warnedFallback = false;

  constructor(options: RedisThrottlerStorageOptions) {
    const resolvedOptions: Required<RedisThrottlerStorageOptions> = {
      host: options.host,
      port: options.port,
      password: options.password ?? '',
      commandTimeoutMs: options.commandTimeoutMs ?? 300,
      keyPrefix: options.keyPrefix ?? 'throttler',
    };

    this.client = new RedisCommandClient(resolvedOptions);
    this.keyPrefix = resolvedOptions.keyPrefix;
  }

  private readonly keyPrefix: string;

  async increment(key: string, ttl: number): Promise<ThrottlerStorageRecord> {
    const redisKey = `${this.keyPrefix}:${key}`;
    const ttlMs = Math.max(1, Math.trunc(ttl));

    try {
      const result = await this.client.command(['EVAL', RATE_LIMIT_SCRIPT, 1, redisKey, ttlMs]);

      if (!Array.isArray(result) || result.length < 2) {
        throw new Error('Unexpected Redis throttler response');
      }

      const totalHits = Number(result[0]);
      const ttlRemainingMs = Number(result[1]);

      return {
        totalHits,
        timeToExpire: Math.max(1, Math.ceil(ttlRemainingMs / 1000)),
      };
    } catch (error) {
      if (!this.warnedFallback) {
        this.warnedFallback = true;
        this.logger.warn(
          `Redis rate limit storage unavailable; using in-memory fallback. ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
      return this.fallback.increment(key, ttlMs);
    }
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
    if (length === -1) return { value: null, offset: line.offset };
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
    if (count === -1) return { value: null, offset: line.offset };

    const values: RedisValue[] = [];
    let currentOffset = line.offset;
    for (let index = 0; index < count; index++) {
      const parsed = parseRedisResponse(buffer, currentOffset);
      if (!parsed) return null;
      values.push(parsed.value);
      currentOffset = parsed.offset;
    }

    return { value: values, offset: currentOffset };
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
