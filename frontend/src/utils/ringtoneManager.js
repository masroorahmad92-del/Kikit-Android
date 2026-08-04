import Sound from 'react-native-sound';
import {Platform} from 'react-native';

// Enable playback in silence mode (iOS)
Sound.setCategory('Playback');

class RingtoneManager {
  constructor() {
    this.ringtone = null;
    this.isPlaying = false;
  }

  init() {
    if (this.ringtone) {
      console.log('Ringtone already initialized');
      return;
    }

    console.log('Initializing ringtone for platform:', Platform.OS);

    // iOS only implementation - use tone.mp3 from assets
    if (Platform.OS === 'ios') {
      console.log('Loading tone.mp3 from main bundle...');
      this.ringtone = new Sound('tone.mp3', Sound.MAIN_BUNDLE, error => {
        if (error) {
          console.log('Failed to load tone.mp3 from main bundle:', error);
          console.log('Error details:', JSON.stringify(error));
          // Try loading from base path as fallback
          console.log('Trying to load from base path...');
          this.ringtone = new Sound('tone.mp3', '', error2 => {
            if (error2) {
              console.log('Failed to load tone.mp3 from base path:', error2);
            } else {
              console.log('Ringtone loaded successfully from base path');
            }
          });
          return;
        }
        console.log('Ringtone loaded successfully from main bundle');
        console.log('Ringtone duration:', this.ringtone.getDuration());
      });
    } else {
      console.log('Platform is not iOS, ringtone not initialized');
    }
  }

  play() {
    if (!this.ringtone || this.isPlaying || Platform.OS !== 'ios') {
      return;
    }

    this.isPlaying = true;
    this.ringtone.setNumberOfLoops(-1); // Loop indefinitely
    this.ringtone.setVolume(1.0); // Max volume
    this.ringtone.play(success => {
      if (!success) {
        console.log('Playback failed');
        this.isPlaying = false;
      } else {
        console.log('Ringtone playing');
      }
    });
  }

  stop() {
    if (!this.ringtone || !this.isPlaying) {
      return;
    }

    console.log('Stopping ringtone');
    this.ringtone.stop(() => {
      this.isPlaying = false;
    });
  }

  release() {
    this.stop();
    if (this.ringtone) {
      this.ringtone.release();
      this.ringtone = null;
    }
  }
}

export default new RingtoneManager();
