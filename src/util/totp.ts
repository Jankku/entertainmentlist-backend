import * as OTPAuth from 'otpauth';
import crypto from 'node:crypto';

const generateSecret = async () => {
  const rfc = await import('rfc4648');
  return rfc.base32.stringify(crypto.randomBytes(16));
};

const generateTOTP = async (email: string) => {
  const secret = await generateSecret();
  const totp = new OTPAuth.TOTP({
    issuer: 'eino',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30, // 30 seconds
    secret: OTPAuth.Secret.fromBase32(secret),
  });

  const otp = totp.generate();
  return { otp, ...totp, secret: totp.secret.base32 };
};

type TOTPConfig = {
  otp: string;
  secret: string;
  algorithm: string;
  digits: number;
  period: number;
};

const validateTOTP = (config: TOTPConfig) => {
  const totp = new OTPAuth.TOTP({
    ...config,
    secret: OTPAuth.Secret.fromBase32(config.secret),
    issuer: 'eino',
    label: 'email',
  });

  const delta = totp.validate({ token: config.otp, window: 1 });

  console.log('delta: ' + delta);

  return delta !== null;
};

export { generateTOTP, validateTOTP };
