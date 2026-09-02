import { describe, expect, it } from 'vitest';

import { createZip } from './create-zip';

const read32 = (bytes: Uint8Array, offset: number) =>
  new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true);

describe('createZip', () => {
  const zip = createZip({ 'a.txt': 'hello', 'dir/b.txt': 'world' });

  it('starts with a local file header', () => {
    expect(read32(zip, 0)).toBe(0x04034b50);
  });

  it('ends with the end-of-central-directory record', () => {
    // No comment, so the record is the last 22 bytes
    expect(read32(zip, zip.length - 22)).toBe(0x06054b50);
  });

  it('records both entries', () => {
    const view = new DataView(zip.buffer, zip.byteOffset);
    expect(view.getUint16(zip.length - 22 + 8, true)).toBe(2);
    expect(view.getUint16(zip.length - 22 + 10, true)).toBe(2);
  });

  it('carries the paths and the contents', () => {
    const text = new TextDecoder().decode(zip);
    expect(text).toContain('a.txt');
    expect(text).toContain('dir/b.txt');
    expect(text).toContain('hello');
    expect(text).toContain('world');
  });

  // A diff between two exports should show what changed, not a timestamp
  it('is byte-identical for identical input', () => {
    expect(createZip({ 'a.txt': 'hello', 'dir/b.txt': 'world' })).toEqual(zip);
  });

  it('handles an empty archive', () => {
    const empty = createZip({});
    expect(empty.length).toBe(22);
    expect(read32(empty, 0)).toBe(0x06054b50);
  });

  it('encodes non-ascii content', () => {
    const bytes = createZip({ 'x.txt': 'café — ok' });
    expect(new TextDecoder().decode(bytes)).toContain('café — ok');
  });
});
