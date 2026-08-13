import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { useEffect } from 'react';
import { useLessonAudio } from './useLessonAudio';

const play = jest.fn(() => Promise.resolve());
const pause = jest.fn();
const load = jest.fn();

describe('useLessonAudio', () => {
  beforeEach(() => {
    play.mockClear();
    play.mockResolvedValue(undefined);
    pause.mockClear();
    load.mockClear();
    Object.defineProperties(HTMLMediaElement.prototype, {
      play: { configurable: true, value: play },
      pause: { configurable: true, value: pause },
      load: { configurable: true, value: load },
    });
    Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: undefined });
  });

  function mount(url = '/audio.mp3', autoPlay = true) {
    let latest: ReturnType<typeof useLessonAudio> | null = null;
    function Harness({
      source,
      playAutomatically,
    }: {
      source: string | null;
      playAutomatically: boolean;
    }) {
      const audio = useLessonAudio(source, { autoPlay: playAutomatically });
      useEffect(() => {
        latest = audio;
      }, [audio]);
      return <audio ref={audio.audioRef} />;
    }
    const rendered = render(<Harness source={url} playAutomatically={autoPlay} />);
    return {
      ...rendered,
      get result() {
        if (!latest) throw new Error('audio hook not ready');
        return latest;
      },
      rerender: (source: string | null) =>
        rendered.rerender(<Harness source={source} playAutomatically={autoPlay} />),
      audio: rendered.container.querySelector('audio')!,
    };
  }

  it('loads, pauses and plays audio, then pauses it on source change and unmount', () => {
    const { rerender, unmount, audio } = mount();
    expect(audio.getAttribute('src')).toBe('/audio.mp3');
    expect(load).toHaveBeenCalled();
    expect(play).toHaveBeenCalled();
    act(() => rerender('/next.mp3'));
    expect(pause).toHaveBeenCalled();
    unmount();
    expect(pause.mock.calls.length).toBeGreaterThan(1);
  });

  it('reports a rejected play promise, muted audio and loading errors', async () => {
    let rejectPlay!: (reason?: unknown) => void;
    play.mockImplementationOnce(
      () =>
        new Promise<void>((_, reject) => {
          rejectPlay = reject;
        }),
    );
    const hook = mount();
    await act(async () => {
      rejectPlay(new Error('blocked'));
    });
    expect(hook.result.audioWarning).toBe('autoplayBlocked');
    const audio = hook.result.audioRef.current!;
    Object.defineProperty(audio, 'muted', { configurable: true, value: true });
    act(() => hook.result.updateAudioVolumeWarning());
    expect(hook.result.audioWarning).toBe('muted');
    act(() => hook.result.handleAudioError());
    expect(hook.result.audioWarning).toBe('loadError');
  });

  it('loads manual audio without starting playback', () => {
    const { audio } = mount('/manual.mp3', false);
    expect(audio.getAttribute('src')).toBe('/manual.mp3');
    expect(load).toHaveBeenCalled();
    expect(play).not.toHaveBeenCalled();
  });
});
