import { createPrivateKey, createPublicKey } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import path from 'node:path';

// Sparkle's EdDSA is Ed25519, the algorithm the Core OTA keys (RENDERER_OTA_*) use, so a
// release without dedicated SPARKLE_ED_* keys signs appcasts with the OTA pair. Sparkle reads
// raw base64 (32-byte public key, 32-byte private seed) where the OTA secrets hold PEM.
const isPem = (key) => key.trimStart().startsWith('-----BEGIN');

const rawBase64 = (jwkValue) => Buffer.from(jwkValue, 'base64url').toString('base64');

/** SUPublicEDKey value for a raw base64 or SPKI PEM Ed25519 public key. */
export const toSparklePublicKey = (key) => {
  if (!key?.trim()) return undefined;
  if (!isPem(key)) return key.trim();
  const jwk = createPublicKey(key).export({ format: 'jwk' });
  if (jwk.crv !== 'Ed25519') throw new Error(`Sparkle needs an Ed25519 key, got ${jwk.crv}`);
  return rawBase64(jwk.x);
};

/** `--ed-key-file` contents for a raw base64 or PKCS8 PEM Ed25519 private key. */
export const toSparklePrivateKey = (key) => {
  if (!key?.trim()) return undefined;
  if (!isPem(key)) return key.trim();
  const jwk = createPrivateKey(key).export({ format: 'jwk' });
  if (jwk.crv !== 'Ed25519') throw new Error(`Sparkle needs an Ed25519 key, got ${jwk.crv}`);
  return rawBase64(jwk.d);
};

/** Raw base64 public key of a raw base64 or PKCS8 PEM Ed25519 private key. */
export const sparklePublicKeyOf = (privateKey) => {
  const seed = Buffer.from(toSparklePrivateKey(privateKey), 'base64');
  if (seed.length !== 32) throw new Error('Sparkle private key must be a 32-byte Ed25519 seed');
  const jwk = createPrivateKey({
    format: 'jwk',
    key: { crv: 'Ed25519', d: seed.toString('base64url'), kty: 'OKP', x: '' },
  });
  return rawBase64(createPublicKey(jwk).export({ format: 'jwk' }).x);
};

// Usage: SPARKLE_ED_PRIVATE_KEY=... [SPARKLE_ED_PUBLIC_KEY=...] node scripts/sparkleKeys.mjs write-private <file>
// With SPARKLE_ED_PUBLIC_KEY set it refuses a private key from another pair, which would sign
// an appcast the shipped builds reject.
if (process.argv[1] && path.resolve(process.argv[1]) === new URL(import.meta.url).pathname) {
  const [command, file] = process.argv.slice(2);
  if (command !== 'write-private' || !file) {
    throw new Error('usage: sparkleKeys.mjs write-private <file>');
  }
  const key = toSparklePrivateKey(process.env.SPARKLE_ED_PRIVATE_KEY);
  if (!key) throw new Error('SPARKLE_ED_PRIVATE_KEY is empty');
  const publicKey = toSparklePublicKey(process.env.SPARKLE_ED_PUBLIC_KEY);
  if (publicKey && sparklePublicKeyOf(key) !== publicKey) {
    throw new Error('SPARKLE_ED_PRIVATE_KEY does not match SPARKLE_ED_PUBLIC_KEY');
  }
  writeFileSync(file, key, { mode: 0o600 });
}
