/** Files to archive, keyed by the path each takes inside the zip. */
export type ZipEntries = Record<string, string>;

const LOCAL_HEADER = 0x04034b50;
const CENTRAL_HEADER = 0x02014b50;
const END_OF_CENTRAL = 0x06054b50;

/** Bit 11 — names and comments are UTF-8. */
const UTF8_FLAG = 0x0800;

/** Stored, not deflated: the whole point of avoiding a compression library. */
const METHOD_STORE = 0;

const crcTable = (() => {
  const table = new Uint32Array(256);

  for (let index = 0; index < 256; index++) {
    let value = index;
    for (let bit = 0; bit < 8; bit++) {
      value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
    }
    table[index] = value >>> 0;
  }

  return table;
})();

const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

/** Little-endian, which is what every field in the format uses. */
class Writer {
  private readonly bytes: Array<number> = [];

  get length(): number {
    return this.bytes.length;
  }

  u16(value: number): void {
    this.bytes.push(value & 0xff, (value >>> 8) & 0xff);
  }

  u32(value: number): void {
    this.bytes.push(
      value & 0xff,
      (value >>> 8) & 0xff,
      (value >>> 16) & 0xff,
      (value >>> 24) & 0xff
    );
  }

  raw(values: Uint8Array): void {
    for (const value of values) {
      this.bytes.push(value);
    }
  }

  toUint8Array(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/**
 * Pack text files into a zip archive.
 *
 * Stored rather than deflated, so there is no compression library and no
 * dependency: these are a few kilobytes of CSS, where the archive is about
 * handing over a folder rather than making it smaller. Every unzip tool reads
 * stored entries.
 *
 * Timestamps are fixed at zero rather than `Date.now()`, so exporting the same
 * theme twice produces identical bytes — a diff between two exports then shows
 * only what actually changed.
 *
 * @param entries - File contents keyed by path within the archive
 * @returns The archive bytes, ready for a Blob or `writeFileSync`
 */
export function createZip(entries: ZipEntries): Uint8Array {
  const encoder = new TextEncoder();
  const file = new Writer();
  const central = new Writer();
  let count = 0;

  for (const [path, contents] of Object.entries(entries)) {
    const name = encoder.encode(path);
    const data = encoder.encode(contents);
    const crc = crc32(data);
    const offset = file.length;

    file.u32(LOCAL_HEADER);
    file.u16(20);
    file.u16(UTF8_FLAG);
    file.u16(METHOD_STORE);
    file.u16(0);
    file.u16(0);
    file.u32(crc);
    file.u32(data.length);
    file.u32(data.length);
    file.u16(name.length);
    file.u16(0);
    file.raw(name);
    file.raw(data);

    central.u32(CENTRAL_HEADER);
    central.u16(20);
    central.u16(20);
    central.u16(UTF8_FLAG);
    central.u16(METHOD_STORE);
    central.u16(0);
    central.u16(0);
    central.u32(crc);
    central.u32(data.length);
    central.u32(data.length);
    central.u16(name.length);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u16(0);
    central.u32(0);
    central.u32(offset);
    central.raw(name);

    count++;
  }

  const archive = new Writer();
  archive.raw(file.toUint8Array());
  archive.raw(central.toUint8Array());
  archive.u32(END_OF_CENTRAL);
  archive.u16(0);
  archive.u16(0);
  archive.u16(count);
  archive.u16(count);
  archive.u32(central.length);
  archive.u32(file.length);
  archive.u16(0);

  return archive.toUint8Array();
}
