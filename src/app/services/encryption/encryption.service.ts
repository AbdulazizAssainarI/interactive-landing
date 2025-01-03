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
      videoUrl: 'https://rr2---sn-npoe7ner.googlevideo.com/videoplayback?expire=1735859754&ei=ysl2Z9GlN8qZ4t4P_8Of2AQ&ip=2405%3A4803%3Ac642%3Af530%3A90ea%3A49f3%3A64b3%3A3786&id=o-AJC0QT25yZrtn6RNM2QsoiGE_Lv11xYO8fjpIrez01yx&itag=18&source=youtube&requiressl=yes&xpc=EgVo2aDSNQ%3D%3D&bui=AfMhrI8DFdLEjjSi6hsJfWyw328opVZ9nf0Gv08AuJm69vhgK05_Qswvrm0mIvexdSqHhy3A2gpfPaij&spc=x-caUBL5_vYocOVSaND7gBiXBOFhxUJeTti2kJDwv2UKUPGa2ImU7Ped3i8ucLntBQ&vprv=1&svpuc=1&mime=video%2Fmp4&ns=PvZojSOFNZJySELkPKxuh3kQ&rqh=1&gir=yes&clen=4239524&ratebypass=yes&dur=56.725&lmt=1728851560712829&fexp=24350590,24350737,24350827,24350851,51326932,51331020,51335594,51371294&c=MWEB&sefc=1&txp=5530434&n=vz67uxDClox1VA&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cxpc%2Cbui%2Cspc%2Cvprv%2Csvpuc%2Cmime%2Cns%2Crqh%2Cgir%2Cclen%2Cratebypass%2Cdur%2Clmt&sig=AJfQdSswRgIhAMRGbBGuKPZ5BPTYtJeOwl8jddgxRRRQqtrd3WSPuPyYAiEA-z1Wd180lbhbct-TDiV5aV6KLbTF6oF_PgJ8zA9gWXk%3D&title=PS5%20VS%20SERIES%20X%20%F0%9F%94%A5%20What%20do%20you%20choose%3F&rm=sn-42u-nbols7s&rrc=79,80&req_id=c11c726ce430a3ee&cmsv=e&redirect_counter=2&cm2rm=sn-i3b6k7s&cms_redirect=yes&met=1735838162,&mh=2A&mip=103.10.226.36&mm=34&mn=sn-npoe7ner&ms=ltu&mt=1735837725&mv=m&mvi=2&pl=24&rms=ltu,au&lsparams=met,mh,mip,mm,mn,ms,mv,mvi,pl,rms&lsig=AGluJ3MwRQIgJj4omNWWJ-hpmhg7pGHwsP8JxP8wqPXh6V7R5e6gPpICIQCg7cb0zJLM0I41vLPYUhdfnL5cNLjk87NJIfo5SoeajA%3D%3D',
      screenSize: {
        width: 1920,
        height: 1080,
      },
      htmlFileUrl: 'https://www.youtube.com/shorts/FcTSPxbMLo0',
      ccFileUrl: 'https://www.youtube.com/shorts/FcTSPxbMLo0',
      videoParts: [
        {
          startTime: 0,
          endTime: 3,
          htmlFileUrl: 'assets/files/content1.html',
        },
        {
          startTime: 4,
          endTime: 6,
          htmlFileUrl: 'assets/files/content2.html',
        },
        {
          startTime: 7,
          endTime: 9,
          htmlFileUrl: 'assets/files/content3.html',
        },
      ],
    },
  };

  _json = JSON.stringify(this._payload);
  _encrypted: string = '';

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
      this._encrypted = this.encryptData(this._payload);
      console.log(this._encrypted);
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
  decryptData(encryptedData?: string): { valid: boolean; data: EncryptedPayload | null } {
    try {
      if (!encryptedData) {
        encryptedData = this._encrypted;
      }
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
