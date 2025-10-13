import { log } from '@/model/Util/Log';

/**
 * Utility class for playing sound files in the application.
 *
 * Uses the HTML5 Audio API to play MP3 files for success/failure feedback.
 */
export class SoundPlayer {
  private passAudio: HTMLAudioElement | null = null;
  private failAudio: HTMLAudioElement | null = null;

  constructor() {
    // Preload audio files for better performance
    this.loadAudioFiles();
  }

  /**
   * Preloads the audio files so they're ready to play.
   * Audio files should be placed in public/assets/sounds/
   */
  private loadAudioFiles() {
    try {
      // Try to construct the proper path for Electron
      // In development, files are served from public/
      // In production, they should be in the resources
      const basePath = this.getBasePath();

      log.info('SoundPlayer: Loading audio files from base path:', basePath);

      this.passAudio = new Audio(`${basePath}/assets/sounds/pass.mp3`);
      this.passAudio.preload = 'auto';
      this.passAudio.volume = 0.1; // Set to 100% volume

      this.failAudio = new Audio(`${basePath}/assets/sounds/fail.mp3`);
      this.failAudio.preload = 'auto';
      this.failAudio.volume = 1.0; // Set to 70% volume

      // Handle loading errors gracefully
      this.passAudio.addEventListener('error', (e) => {
        log.error('Failed to load pass.mp3 sound file. Path tried:', `${basePath}/assets/sounds/pass.mp3`, 'Error:', e);
      });

      this.failAudio.addEventListener('error', (e) => {
        log.error('Failed to load fail.mp3 sound file. Path tried:', `${basePath}/assets/sounds/fail.mp3`, 'Error:', e);
      });

      // Add load success handlers for debugging
      this.passAudio.addEventListener('canplaythrough', () => {
        log.info('SoundPlayer: pass.mp3 loaded successfully');
      });

      this.failAudio.addEventListener('canplaythrough', () => {
        log.info('SoundPlayer: fail.mp3 loaded successfully');
      });
    } catch (error) {
      log.error('Error initializing sound player:', error);
    }
  }

  /**
   * Gets the base path for loading assets.
   * In Electron, this handles both development and production paths.
   */
  private getBasePath(): string {
    // Use relative path (./assets) instead of absolute path (/assets)
    // This works in both dev and production for Electron
    // In dev: served from public/ folder by Vite
    // In production: bundled into out/renderer/ folder
    return '.';
  }

  /**
   * Plays the "pass" sound (pass.mp3).
   */
  playDing() {
    if (!this.passAudio) {
      log.warn('Pass audio not loaded');
      return;
    }

    try {
      // Clone the audio element if we need to play multiple sounds simultaneously
      const audio = this.passAudio.cloneNode() as HTMLAudioElement;

      // Play and handle potential autoplay restrictions
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          log.warn('Failed to play pass sound:', error);
        });
      }
    } catch (error) {
      log.error('Error playing pass sound:', error);
    }
  }

  /**
   * Plays the "fail" sound (fail.mp3).
   */
  playBuzzer() {
    if (!this.failAudio) {
      log.warn('Fail audio not loaded');
      return;
    }

    try {
      // Clone the audio element if we need to play multiple sounds simultaneously
      const audio = this.failAudio.cloneNode() as HTMLAudioElement;

      // Play and handle potential autoplay restrictions
      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          log.warn('Failed to play fail sound:', error);
        });
      }
    } catch (error) {
      log.error('Error playing fail sound:', error);
    }
  }

  /**
   * Clean up audio resources.
   */
  cleanup() {
    if (this.passAudio) {
      this.passAudio.pause();
      this.passAudio.src = '';
      this.passAudio = null;
    }

    if (this.failAudio) {
      this.failAudio.pause();
      this.failAudio.src = '';
      this.failAudio = null;
    }
  }
}
