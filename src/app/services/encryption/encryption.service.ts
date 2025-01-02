import { Inject, Injectable } from '@angular/core';
import * as CryptoJS from 'crypto-js';
import { EncryptedPayload } from '../../shared/interfaces/data.model';
import { environment } from '../../shared/environment/environment';
import { isPlatformBrowser } from '@angular/common';
import { PLATFORM_ID } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncryptionService {
  private secretKey!: CryptoJS.lib.WordArray;

  _payload = {
    metadata: {
      creationDate: '2025-01-01T10:26',
      startAfterDays: 0,
      validityDays: 30,
    },
    data: {
      videoUrl: 'https://www.youtube.com/watch?v=1p65LyjdpUM',
      screenSize: {
        width: 1920,
        height: 1080,
      },
      htmlFileUrl: 'https://www.youtube.com/watch?v=1p65LyjdpUM',
      ccFileUrl: 'https://www.youtube.com/watch?v=1p65LyjdpUM',
      jsonData: [
        {
          startTime: 0,
          endTime: 10,
          htmlFileUrl: 'assets/files/content1.html',
        },
        {
          startTime: 11,
          endTime: 20,
          htmlFileUrl: 'assets/files/content2.html',
        },
        {
          startTime: 21,
          endTime: 30,
          htmlFileUrl: 'assets/files/content3.html',
        },
      ],
    },
  };

  _json = JSON.stringify(this._payload);

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeEncryption();
    }
  }

  initializeEncryption() {
    try {
      // Parse the Base64-encoded secret key
      this.secretKey = CryptoJS.enc.Base64.parse(environment.secretKey);

      console.log('Secret Key:', this.secretKey);
      console.log('Secret Key Length:', this.secretKey.sigBytes); // Should be 32 for AES-256

      if (this.secretKey.sigBytes !== 32) {
        throw new Error('Invalid secret key length. Expected 32 bytes for AES-256.');
      }

      console.log('Payload:', this._json);
      const encrypted = this.encryptData(this._payload);
      console.log('Encrypted:', encrypted);
    } catch (error) {
      console.error('Initialization failed:', error);
    }
  }

  // Encrypt data with metadata
  encryptData(payload: EncryptedPayload): string {
    try {
      const json = JSON.stringify(payload);
      const iv = CryptoJS.lib.WordArray.random(16); // 16 bytes IV for AES

      const encrypted = CryptoJS.AES.encrypt(json, this.secretKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      // Combine IV and ciphertext
      const combined = iv.concat(encrypted.ciphertext).toString(CryptoJS.enc.Base64);
      return encodeURIComponent(combined);
    } catch (error) {
      console.error('Encryption failed:', error);
      throw error;
    }
  }

  // Decrypt data and validate
  decryptData(encryptedData: string): { valid: boolean; data: EncryptedPayload | null } {
    try {
      // Decode the encrypted data from URI component and Base64
      const decoded = decodeURIComponent(encryptedData);
      const combined = CryptoJS.enc.Base64.parse(decoded);
  
      // Extract IV (first 16 bytes) and ciphertext
      const iv = CryptoJS.lib.WordArray.create(combined.words.slice(0, 4), 16); // 16 bytes = 4 words
      const ciphertext = CryptoJS.lib.WordArray.create(combined.words.slice(4), combined.sigBytes - 16);
  
      // Properly create CipherParams object
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertext,
      });
  
      // Decrypt using the CipherParams object and the extracted IV
      const decrypted = CryptoJS.AES.decrypt(cipherParams, this.secretKey, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });
  
      // Convert decrypted data to UTF-8 string
      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
  
      if (!jsonString) {
        return { valid: false, data: null };
      }
  
      // Parse the JSON string back to the payload object
      const payload: EncryptedPayload = JSON.parse(jsonString);
  
      // Validate metadata
      const creationDate = new Date(payload.metadata.creationDate);
      const startAfterDate = new Date(creationDate);
      startAfterDate.setDate(startAfterDate.getDate() + payload.metadata.startAfterDays);
      const expirationDate = new Date(startAfterDate);
      expirationDate.setDate(expirationDate.getDate() + payload.metadata.validityDays);
      const now = new Date();
  
      const valid = now >= startAfterDate && now <= expirationDate;
      
      console.log(`Decrypted returned ${valid}: `, payload);
      return { valid, data: payload };
    } catch (error) {
      console.error('Decryption failed:', error);
      return { valid: false, data: null };
    }
  }
}
