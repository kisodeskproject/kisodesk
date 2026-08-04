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
  activeDurationMs: number; totalInputs: number; totalFinalInputs: number; correctInputs: number;
  totalIncorrectAttempts: number; correctedErrors: number; uncorrectedErrors: number;
  backspaces: number; grossWpm: number; effectiveWpm: number; accuracy: number;
  finalAccuracy: number; medianLatencyMs: number; accentErrors: number;
  deadKeyErrors: number; segments: { index: number; accuracy: number; grossWpm: number; unrelatedBackspaces: number }[];
  keyStats: Map<string, { presses: number; errors: number }>;
  bigramStats: Map<string, { first: string; second: string; presses: number; errors: number; latencySum: number; latencySamples: number }>;
  keyErrors: Map<string, number>;
  bigramErrors: Map<string, number>;
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
    const activeInputs: typeof inputs = [];
    let unrelatedBackspaces = 0;
    for (const event of events) {
      if (event.kind === 'input') {
        activeInputs.push(event);
      } else if (event.kind === 'backspace') {
        if (event.position === activeInputs.length && activeInputs.length > 0) {
          activeInputs.pop();
        } else {
          unrelatedBackspaces++;
        }
      }
    }

    const totalIncorrectAttempts = inputs.filter((event) => event.correct === false).length;
    const uncorrectedInputs = activeInputs.filter((event) => event.correct !== true);
    const uncorrectedErrors = uncorrectedInputs.length;
    const correctedErrors = totalIncorrectAttempts - uncorrectedErrors;
    const correctInputs = activeInputs.length - uncorrectedErrors;
    const keyStats = new Map<string, { presses: number; errors: number }>();
    const bigramStats = new Map<string, { first:string; second:string; presses:number; errors:number; latencySum:number; latencySamples:number }>();
    const keyErrors = new Map<string, number>();
    const bigramErrors = new Map<string, number>();

    for (const event of activeInputs) {
      const expected = (event.expected ?? '').normalize('NFC');
      if (!expected) continue;
      const key = keyStats.get(expected) ?? { presses: 0, errors: 0 };
      key.presses++;
      if (event.correct !== true) {
        key.errors++;
        keyErrors.set(expected, (keyErrors.get(expected) ?? 0) + 1);
      }
      keyStats.set(expected, key);
    }

    for (let index = 1; index < activeInputs.length; index++) {
      const previous = activeInputs[index - 1];
      const event = activeInputs[index];
      const first = (previous.expected ?? '').normalize('NFC');
      const expected = (event.expected ?? '').normalize('NFC');
      if (first && expected) {
        const id = `${first}\u0000${expected}`;
        const bigram = bigramStats.get(id) ?? { first, second: expected, presses: 0, errors: 0, latencySum: 0, latencySamples: 0 };
        bigram.presses++;
        if (event.correct !== true) {
          bigram.errors++;
          bigramErrors.set(id, (bigramErrors.get(id) ?? 0) + 1);
        }
        const latency = event.timestamp - previous.timestamp;
        if (latency >= 20 && latency <= 2000) { bigram.latencySum += latency; bigram.latencySamples++; }
        bigramStats.set(id, bigram);
      }
    }

    const accentErrors = uncorrectedInputs.filter((event) => /[\u0300-\u036fáéíóúüàèìòùâêîôû]/iu.test(event.expected ?? '')).length;
    const deadKeyErrors = uncorrectedInputs.filter((event) => event.composing).length;
    const minutes = activeDurationMs / 60000;
    const grossWpm = minutes ? (activeInputs.length / 5) / minutes : 0;
    const finalAccuracy = activeInputs.length ? (correctInputs / activeInputs.length) * 100 : 100;
    const effectiveWpm = (correctInputs / 5) / minutes;
    const segmentCount = Math.min(4, Math.max(1, Math.ceil(activeInputs.length / 25)));
    const segments = Array.from({ length: segmentCount }, (_, index) => {
      const from = Math.floor((activeInputs.length * index) / segmentCount), to = Math.floor((activeInputs.length * (index + 1)) / segmentCount);
      const group = activeInputs.slice(from, to), duration = Math.max(1, (group[group.length - 1]?.timestamp ?? startedAt) - (group[0]?.timestamp ?? startedAt));
      const correct = group.filter((event) => event.correct).length;
      return { index, accuracy: group.length ? (correct / group.length) * 100 : 100, grossWpm: group.length ? (group.length / 5) / (duration / 60000) : 0 };
    });
    const latencies = activeInputs.slice(1).map((event, index) => event.timestamp - activeInputs[index].timestamp).filter((value) => value >= 20 && value <= 2000).sort((a, b) => a - b);
    const medianLatencyMs = latencies.length ? latencies[Math.floor(latencies.length / 2)] : 0;
    return { activeDurationMs, totalInputs: inputs.length, totalFinalInputs: activeInputs.length, correctInputs,
      totalIncorrectAttempts, correctedErrors, uncorrectedErrors,
      backspaces: events.filter((event) => event.kind === 'backspace').length, grossWpm, effectiveWpm,
      accuracy: finalAccuracy, finalAccuracy, medianLatencyMs, accentErrors, deadKeyErrors,
      segments: segments.map((segment) => ({ ...segment, unrelatedBackspaces })), keyStats, bigramStats,
      keyErrors, bigramErrors };
  }

  async persistAggregates(tx: Prisma.TransactionClient, userId: string, languageCode: LanguageCode, layoutId: string, derived: DerivedTelemetry) {
    for (const [keyChar, value] of derived.keyStats) {
      if (!keyChar) continue;
      await tx.$executeRaw`INSERT INTO "key_layout_stats" ("user_id","language_code","layout_id","key_char","total_presses","total_errors","error_rate","updated_at") VALUES (${userId},${languageCode}::"LanguageCode",${layoutId},${keyChar},${value.presses},${value.errors},${value.errors * 100 / value.presses},NOW()) ON CONFLICT ("user_id","language_code","layout_id","key_char") DO UPDATE SET "total_presses"="key_layout_stats"."total_presses"+${value.presses}, "total_errors"="key_layout_stats"."total_errors"+${value.errors}, "error_rate"=(("key_layout_stats"."total_errors"+${value.errors})::float/("key_layout_stats"."total_presses"+${value.presses})::float)*100, "updated_at"=NOW()`;
    }
    for (const value of derived.bigramStats.values()) await tx.$executeRaw`INSERT INTO "bigram_stats" ("user_id","language_code","layout_id","first_char","second_char","total_presses","total_errors","average_latency_ms","latency_samples","updated_at") VALUES (${userId},${languageCode}::"LanguageCode",${layoutId},${value.first},${value.second},${value.presses},${value.errors},${value.latencySamples ? value.latencySum / value.latencySamples : 0},${value.latencySamples},NOW()) ON CONFLICT ("user_id","language_code","layout_id","first_char","second_char") DO UPDATE SET "average_latency_ms"=CASE WHEN ("bigram_stats"."latency_samples"+${value.latencySamples})>0 THEN (("bigram_stats"."average_latency_ms"*"bigram_stats"."latency_samples")+${value.latencySum})/("bigram_stats"."latency_samples"+${value.latencySamples}) ELSE 0 END, "latency_samples"="bigram_stats"."latency_samples"+${value.latencySamples}, "total_presses"="bigram_stats"."total_presses"+${value.presses}, "total_errors"="bigram_stats"."total_errors"+${value.errors}, "updated_at"=NOW()`;
  }
  getFinger(code: string) { return getLayoutKeyRecommendation('', code); }
}
