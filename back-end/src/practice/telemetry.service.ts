import { Injectable } from '@nestjs/common';
import { LanguageCode, Prisma } from '@prisma/client';
import { TypingTelemetryDto } from './dto/save-practice.dto';
import { getLayoutKeyRecommendation } from './keyboard-layout-catalog';

type Hand = 'left' | 'right' | 'both' | 'unknown';
type Finger = 'pinky' | 'ring' | 'middle' | 'index' | 'thumb' | 'unknown';
const PHYSICAL_FINGERS: Record<string, { hand: Hand; finger: Finger }> = {
  KeyQ:{hand:'left',finger:'pinky'}, KeyA:{hand:'left',finger:'pinky'}, KeyZ:{hand:'left',finger:'pinky'},
  KeyW:{hand:'left',finger:'ring'}, KeyS:{hand:'left',finger:'ring'}, KeyX:{hand:'left',finger:'ring'},
  KeyE:{hand:'left',finger:'middle'}, KeyD:{hand:'left',finger:'middle'}, KeyC:{hand:'left',finger:'middle'},
  KeyR:{hand:'left',finger:'index'}, KeyT:{hand:'left',finger:'index'}, KeyF:{hand:'left',finger:'index'}, KeyG:{hand:'left',finger:'index'}, KeyV:{hand:'left',finger:'index'}, KeyB:{hand:'left',finger:'index'},
  KeyY:{hand:'right',finger:'index'}, KeyU:{hand:'right',finger:'index'}, KeyH:{hand:'right',finger:'index'}, KeyJ:{hand:'right',finger:'index'}, KeyN:{hand:'right',finger:'index'}, KeyM:{hand:'right',finger:'index'},
  KeyI:{hand:'right',finger:'middle'}, KeyK:{hand:'right',finger:'middle'}, KeyO:{hand:'right',finger:'ring'}, KeyL:{hand:'right',finger:'ring'}, KeyP:{hand:'right',finger:'pinky'},
  Space:{hand:'both',finger:'thumb'},
};

export type DerivedTelemetry = {
  activeDurationMs: number; totalInputs: number; correctInputs: number; errors: number;
  correctedErrors: number; uncorrectedErrors: number; backspaces: number; grossWpm: number;
  effectiveWpm: number; accuracy: number; medianLatencyMs: number; accentErrors: number;
  deadKeyErrors: number; segments: { index: number; accuracy: number; grossWpm: number; unrelatedBackspaces: number }[];
  keys: Map<string, { presses: number; errors: number }>;
  bigrams: Map<string, { first: string; second: string; presses: number; errors: number; latencySum: number; latencySamples: number }>;
};

@Injectable()
export class TelemetryService {
  derive(telemetry: TypingTelemetryDto): DerivedTelemetry {
    const events = [...telemetry.events].sort((a,b) => a.sequence - b.sequence || a.timestamp - b.timestamp);
    const inputs = events.filter((event) => event.kind === 'input');
    const startedAt = telemetry.startedAt ?? inputs[0]?.timestamp ?? 0;
    const endedAt = events[events.length - 1]?.timestamp ?? startedAt;
    const totalDurationMs = Math.max(0, endedAt - startedAt);
    const activeDurationMs = Math.max(1, totalDurationMs - telemetry.pausedMs);
    const keys = new Map<string, { presses: number; errors: number }>();
    const bigrams = new Map<string, { first:string; second:string; presses:number; errors:number; latencySum:number; latencySamples:number }>();
    const failedPositions = new Set<number>();
    const replacedPositions = new Set<number>();
    const committedPositions: number[] = [];
    let unrelatedBackspaces = 0;
    for (const event of events) {
      if (event.kind === 'input' && event.correct) {
        if (failedPositions.has(event.position)) replacedPositions.add(event.position);
        committedPositions.push(event.position);
      } else if (event.kind === 'input') {
        failedPositions.add(event.position);
      } else if (event.kind === 'backspace') {
        if (committedPositions[committedPositions.length - 1] === event.position - 1) committedPositions.pop();
        else unrelatedBackspaces++;
      }
    }
    let correctInputs = 0, accentErrors = 0, deadKeyErrors = 0;
    let previous: typeof inputs[number] | undefined;
    for (const event of inputs) {
      const expected = (event.expected ?? '').normalize('NFC');
      const correct = event.correct === true;
      if (correct) correctInputs++;
      const key = keys.get(expected) ?? { presses: 0, errors: 0 };
      key.presses++;
      if (!correct) key.errors++;
      keys.set(expected, key);
      if (!correct && /[\u0300-\u036fáéíóúüàèìòùâêîôû]/iu.test(expected)) accentErrors++;
      if (!correct && event.composing) deadKeyErrors++;
      if (previous) {
        const first = (previous.expected ?? '').normalize('NFC');
        const id = `${first}\u0000${expected}`;
        const bigram = bigrams.get(id) ?? { first, second: expected, presses: 0, errors: 0, latencySum: 0, latencySamples: 0 };
        bigram.presses++;
        if (!correct) bigram.errors++;
        const latency = event.timestamp - previous.timestamp;
        if (latency >= 20 && latency <= 2000) { bigram.latencySum += latency; bigram.latencySamples++; }
        bigrams.set(id, bigram);
      }
      previous = event;
    }
    const errors = inputs.length - correctInputs;
    const correctedErrors = inputs.filter((event) => event.correct === false && replacedPositions.has(event.position)).length;
    const uncorrectedErrors = errors - correctedErrors;
    const minutes = activeDurationMs / 60000;
    const grossWpm = minutes ? (inputs.length / 5) / minutes : 0;
    const accuracy = inputs.length ? (correctInputs / inputs.length) * 100 : 100;
    const effectiveWpm = (correctInputs / 5) / minutes;
    const segmentCount = Math.min(4, Math.max(1, Math.ceil(inputs.length / 25)));
    const segments = Array.from({ length: segmentCount }, (_, index) => {
      const from = Math.floor((inputs.length * index) / segmentCount), to = Math.floor((inputs.length * (index + 1)) / segmentCount);
      const group = inputs.slice(from, to), duration = Math.max(1, (group[group.length - 1]?.timestamp ?? startedAt) - (group[0]?.timestamp ?? startedAt));
      const correct = group.filter((event) => event.correct).length;
      return { index, accuracy: group.length ? (correct / group.length) * 100 : 100, grossWpm: group.length ? (group.length / 5) / (duration / 60000) : 0 };
    });
    const latencies = inputs.slice(1).map((event, index) => event.timestamp - inputs[index].timestamp).filter((value) => value >= 20 && value <= 2000).sort((a, b) => a - b);
    const medianLatencyMs = latencies.length ? latencies[Math.floor(latencies.length / 2)] : 0;
    return { activeDurationMs, totalInputs: inputs.length, correctInputs, errors, correctedErrors, uncorrectedErrors,
      backspaces: events.filter((event) => event.kind === 'backspace').length, grossWpm, effectiveWpm, accuracy,
      medianLatencyMs, accentErrors, deadKeyErrors, segments: segments.map((segment) => ({ ...segment, unrelatedBackspaces })), keys, bigrams };
  }

  async persistAggregates(tx: Prisma.TransactionClient, userId: string, languageCode: LanguageCode, localeCode: string, layoutId: string, derived: DerivedTelemetry) {
    for (const [keyChar, value] of derived.keys) {
      if (!keyChar) continue;
      await tx.$executeRaw`INSERT INTO "key_layout_stats" ("user_id","language_code","layout_id","key_char","total_presses","total_errors","error_rate","updated_at") VALUES (${userId},${languageCode}::"LanguageCode",${layoutId},${keyChar},${value.presses},${value.errors},${value.errors * 100 / value.presses},NOW()) ON CONFLICT ("user_id","language_code","layout_id","key_char") DO UPDATE SET "total_presses"="key_layout_stats"."total_presses"+${value.presses}, "total_errors"="key_layout_stats"."total_errors"+${value.errors}, "error_rate"=(("key_layout_stats"."total_errors"+${value.errors})::float/("key_layout_stats"."total_presses"+${value.presses})::float)*100, "updated_at"=NOW()`;
      await tx.$executeRaw`INSERT INTO "key_stats" ("user_id","language_code","locale_code","key_char","total_presses","total_errors","error_rate","updated_at") VALUES (${userId},${languageCode}::"LanguageCode",${localeCode},${keyChar},${value.presses},${value.errors},${value.errors * 100 / value.presses},NOW()) ON CONFLICT ("user_id","language_code","locale_code","key_char") DO UPDATE SET "total_presses"="key_stats"."total_presses"+${value.presses}, "total_errors"="key_stats"."total_errors"+${value.errors}, "error_rate"=(("key_stats"."total_errors"+${value.errors})::float/("key_stats"."total_presses"+${value.presses})::float)*100, "updated_at"=NOW()`;
    }
    for (const value of derived.bigrams.values()) await tx.$executeRaw`INSERT INTO "bigram_stats" ("user_id","language_code","layout_id","first_char","second_char","total_presses","total_errors","average_latency_ms","latency_samples","updated_at") VALUES (${userId},${languageCode}::"LanguageCode",${layoutId},${value.first},${value.second},${value.presses},${value.errors},${value.latencySamples ? value.latencySum / value.latencySamples : 0},${value.latencySamples},NOW()) ON CONFLICT ("user_id","language_code","layout_id","first_char","second_char") DO UPDATE SET "average_latency_ms"=CASE WHEN ("bigram_stats"."latency_samples"+${value.latencySamples})>0 THEN (("bigram_stats"."average_latency_ms"*"bigram_stats"."latency_samples")+${value.latencySum})/("bigram_stats"."latency_samples"+${value.latencySamples}) ELSE 0 END, "latency_samples"="bigram_stats"."latency_samples"+${value.latencySamples}, "total_presses"="bigram_stats"."total_presses"+${value.presses}, "total_errors"="bigram_stats"."total_errors"+${value.errors}, "updated_at"=NOW()`;
  }
  getFinger(code: string) { return getLayoutKeyRecommendation('', code); }
}
