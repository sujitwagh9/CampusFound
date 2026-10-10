import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';

const client = new OAuth2Client();

// Wrapped in an object so tests can substitute a fake verifier
export const google = {
  /**
   * Verifies a Google Sign-In ID token (signature, expiry, issuer and that it
   * was issued for *our* client ID) and returns its payload.
   */
  async verifyIdToken(idToken) {
    const ticket = await client.verifyIdToken({ idToken, audience: config.google.clientId });
    return ticket.getPayload();
  },
};
