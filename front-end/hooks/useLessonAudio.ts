import { useCallback, useEffect, useRef, useState } from 'react';

export type AudioWarning = 'muted' | 'noOutput' | 'autoplayBlocked' | 'loadError' | null;

interface LessonAudioOptions {
  autoPlay?: boolean;
}

export function useLessonAudio(
  audioUrl?: string | null,
  { autoPlay = true }: LessonAudioOptions = {},
) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const [audioWarning, setAudioWarning] = useState<AudioWarning>(null);

  const updateAudioVolumeWarning = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    setAudioWarning((current) => {
      if (audio.muted || audio.volume === 0) return 'muted';
      return current === 'muted' ? null : current;
    });
  }, []);

  const handleAudioError = useCallback(() => {
    setAudioWarning('loadError');
  }, []);

  const clearPlaybackWarning = useCallback(() => {
    setAudioWarning((current) =>
      current === 'autoplayBlocked' || current === 'loadError' ? null : current,
    );
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    setAudioWarning(null);
    activeAudioUrlRef.current = audioUrl ?? null;
    if (!audioUrl || !audio) return;

    let cancelled = false;
    const expectedAudioUrl = audioUrl;
    const detectAudioOutput = async () => {
      if (
        !navigator.mediaDevices?.enumerateDevices ||
        !('setSinkId' in HTMLMediaElement.prototype)
      ) {
        return;
      }

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled && !devices.some((device) => device.kind === 'audiooutput')) {
          setAudioWarning('noOutput');
        }
      } catch {
        // Device inspection is optional and may be denied by the browser.
      }
    };

    audio.pause();
    audio.currentTime = 0;
    activeAudioUrlRef.current = expectedAudioUrl;
    if (audio.getAttribute('src') !== expectedAudioUrl) audio.setAttribute('src', expectedAudioUrl);
    audio.load();
    updateAudioVolumeWarning();
    void detectAudioOutput();
    if (autoPlay) {
      audio.play().catch(() => {
        if (!cancelled) {
          setAudioWarning(audio.muted || audio.volume === 0 ? 'muted' : 'autoplayBlocked');
        }
      });
    }
    navigator.mediaDevices?.addEventListener?.('devicechange', detectAudioOutput);

    return () => {
      cancelled = true;
      audio.pause();
      audio.currentTime = 0;
      if (activeAudioUrlRef.current === expectedAudioUrl) activeAudioUrlRef.current = null;
      navigator.mediaDevices?.removeEventListener?.('devicechange', detectAudioOutput);
    };
  }, [audioUrl, autoPlay, updateAudioVolumeWarning]);

  return {
    activeAudioUrlRef,
    audioRef,
    audioWarning,
    clearPlaybackWarning,
    handleAudioError,
    updateAudioVolumeWarning,
  };
}
