class SecureChatCrypto {
  constructor() {
    this.keyPair = null;
    this.sharedSecret = null;
  }

  async generateKeyPair() {
    this.keyPair = await crypto.subtle.generateKey(
      { name: "ECDH", namedCurve: "P-256" },
      true,
      ["deriveKey", "deriveBits"]
    );
  }

  async exportPublicKey() {
    return await crypto.subtle.exportKey("jwk", this.keyPair.publicKey);
  }

  async computeSharedSecret(publicKeyJwk) {
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      publicKeyJwk,
      { name: "ECDH", namedCurve: "P-256" },
      true,
      []
    );

    this.sharedSecret = await crypto.subtle.deriveKey(
      { name: "ECDH", public: publicKey },
      this.keyPair.privateKey,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  }

  async encryptMessage(message) {
    if (!this.sharedSecret) throw new Error("Shared secret not computed yet.");
    const enc = new TextEncoder();
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const cipherBuffer = await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      this.sharedSecret,
      enc.encode(message)
    );
    return {
      ciphertext: Array.from(new Uint8Array(cipherBuffer)),
      iv: Array.from(iv)
    };
  }

  async decryptMessage(encryptedData) {
    if (!this.sharedSecret) throw new Error("Shared secret not computed yet.");
    try {
      const cipherBuffer = new Uint8Array(encryptedData.ciphertext);
      const ivBuffer = new Uint8Array(encryptedData.iv);
      const plainBuffer = await crypto.subtle.decrypt(
        { name: "AES-GCM", iv: ivBuffer },
        this.sharedSecret,
        cipherBuffer
      );
      const dec = new TextDecoder();
      return dec.decode(plainBuffer);
    } catch (err) {
      console.error("Decryption failed", err);
      return "[Encrypted Message - Unreadable]";
    }
  }
}

export default SecureChatCrypto;
