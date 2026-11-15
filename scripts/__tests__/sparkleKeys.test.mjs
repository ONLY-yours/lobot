import { execFileSync } from 'node:child_process';
import { generateKeyPairSync } from 'node:crypto';
import { mkdtempSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { sparklePublicKeyOf, toSparklePrivateKey, toSparklePublicKey } from '../sparkleKeys.mjs';

const SCRIPT = path.resolve(__dirname, '../sparkleKeys.mjs');

const { privateKey, publicKey } = generateKeyPairSync('ed25519');
const privatePem = privateKey.export({ format: 'pem', type: 'pkcs8' });
const publicPem = publicKey.export({ format: 'pem', type: 'spki' });

// Ed25519 PKCS8 / SPKI DER end with the 32-byte seed / public key.
const rawTail = (key, type) => key.export({ format: 'der', type }).subarray(-32).toString('base64');

describe('sparkle keys', () => {
  it('converts the OTA PEM pair into the raw base64 Sparkle reads', () => {
    expect(toSparklePublicKey(publicPem)).toBe(rawTail(publicKey, 'spki'));
    expect(toSparklePrivateKey(privatePem)).toBe(rawTail(privateKey, 'pkcs8'));
    expect(Buffer.from(toSparklePrivateKey(privatePem), 'base64')).toHaveLength(32);
  });

  it('passes raw base64 keys through and treats blanks as unset', () => {
    expect(toSparklePublicKey(' abc= \n')).toBe('abc=');
    expect(toSparklePrivateKey('seed=')).toBe('seed=');
    expect(toSparklePublicKey('')).toBeUndefined();
    expect(toSparklePrivateKey(undefined)).toBeUndefined();
  });

  it('rejects non-Ed25519 keys', () => {
    const rsa = generateKeyPairSync('rsa', { modulusLength: 2048 });
    expect(() => toSparklePublicKey(rsa.publicKey.export({ format: 'pem', type: 'spki' }))).toThrow(
      'Ed25519',
    );
  });

  it('derives the public key of a private key in either encoding', () => {
    expect(sparklePublicKeyOf(privatePem)).toBe(toSparklePublicKey(publicPem));
    expect(sparklePublicKeyOf(toSparklePrivateKey(privatePem))).toBe(toSparklePublicKey(publicPem));
  });

  it('writes the key file only for a matching pair', () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'sparkle-keys-'));
    const file = path.join(dir, 'ed_key');
    const run = (publicKeyEnv) =>
      execFileSync(process.execPath, [SCRIPT, 'write-private', file], {
        env: { SPARKLE_ED_PRIVATE_KEY: privatePem, SPARKLE_ED_PUBLIC_KEY: publicKeyEnv },
        stdio: 'pipe',
      });

    run(publicPem);
    expect(readFileSync(file, 'utf8')).toBe(toSparklePrivateKey(privatePem));

    const other = generateKeyPairSync('ed25519').publicKey.export({ format: 'pem', type: 'spki' });
    expect(() => run(other)).toThrow(/does not match/);
  });
});
