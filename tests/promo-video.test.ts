import { closeSync, openSync, readSync, statSync } from 'node:fs';
import { join } from 'node:path';

const media = join(__dirname, '..', 'docs', 'media');

describe.each(['offline-detector-promo-9x16.mp4', 'offline-detector-promo-16x9.mp4'])(
  'the promo video %s tracked in docs/media',
  (name) => {
    const video = join(media, name);

    it('is an MP4 container', () => {
      const fd = openSync(video, 'r');
      const header = Buffer.alloc(12);
      readSync(fd, header, 0, 12, 0);
      closeSync(fd);
      // An MP4 starts with a box size, then the ASCII type "ftyp".
      expect(header.subarray(4, 8).toString('ascii')).toBe('ftyp');
    });

    it('stays small enough to live in the repository history (1 MB to 8 MB)', () => {
      const { size } = statSync(video);
      expect(size).toBeGreaterThan(1_000_000);
      expect(size).toBeLessThan(8_000_000);
    });
  },
);
