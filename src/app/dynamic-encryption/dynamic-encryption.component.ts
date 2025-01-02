import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { EncryptionService } from '../services/encryption/encryption.service';
import { EncryptedPayload, Metadata } from '../shared/interfaces/data.model';
import { VideoData, VideoPart } from '../shared/interfaces/video-data.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dynamic-encryption',
  imports: [
    CommonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './dynamic-encryption.component.html',
  styleUrls: ['./dynamic-encryption.component.scss'],
})
export class DynamicEncryptionComponent implements OnInit {
  mode: 'encrypt' | 'decrypt' = 'encrypt';
  dataTypes: string[] = ['Video']; // Extendable for more types

  encryptionForm: FormGroup;
  decryptionForm: FormGroup;
  encryptedData: string = '';
  decryptionResult: any = null;

  constructor(private fb: FormBuilder, private encryptionService: EncryptionService) {
    // Encryption Form Initialization
    this.encryptionForm = this.fb.group({
      dataType: ['Video', Validators.required],
      metadata: this.fb.group({
        creationDate: [this.getCurrentDateTimeLocal(), Validators.required],
        startAfterDays: [0, [Validators.required, Validators.min(0)]],
        validityDays: [30, [Validators.required, Validators.min(1)]],
      }),
      data: this.fb.group({}),
    });

    // Decryption Form Initialization
    this.decryptionForm = this.fb.group({
      encryptedData: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.buildEncryptionForm();

    // Listen to dataType changes to rebuild the form dynamically
    this.encryptionForm.get('dataType')?.valueChanges.subscribe(() => {
      this.buildEncryptionForm();
    });
  }

  // Helper to get current date in 'yyyy-MM-ddTHH:mm' format for datetime-local input
  getCurrentDateTimeLocal(): string {
    const now = new Date();
    now.setSeconds(0, 0);
    return now.toISOString().substring(0, 16);
  }

  // Build Encryption Form based on dataType
  buildEncryptionForm(): void {
    const dataGroup = this.encryptionForm.get('data') as FormGroup;
    dataGroup.reset();

    if (this.encryptionForm.get('dataType')?.value === 'Video') {
      const videoGroup = this.fb.group({
        videoUrl: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
        screenSize: this.fb.group({
          width: [1920, [Validators.required, Validators.min(1)]],
          height: [1080, [Validators.required, Validators.min(1)]],
        }),
        htmlFileUrl: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
        ccFileUrl: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
        jsonData: this.fb.array([this.createVideoPart()]),
      });

      dataGroup.addControl('video', videoGroup);
    }
    // Add more data types here if needed
  }

  // Create Video Part FormGroup
  createVideoPart(): FormGroup {
    return this.fb.group({
      startTime: [0, [Validators.required, Validators.min(0)]],
      endTime: [10, [Validators.required, Validators.min(1)]],
      htmlFileUrl: ['', [Validators.required, Validators.pattern(/^(http|https):\/\/[^ "]+$/)]],
    });
  }

  // Get JSON Data FormArray
  get jsonData(): FormArray {
    return (this.encryptionForm.get('data')?.get('video') as FormGroup)?.get('jsonData') as FormArray;
  }

  // Add Video Part
  addVideoPart(): void {
    this.jsonData.push(this.createVideoPart());
  }

  // Remove Video Part
  removeVideoPart(index: number): void {
    if (this.jsonData.length > 1) {
      this.jsonData.removeAt(index);
    }
  }

  // Encrypt Function
  encrypt(): void {
    if (this.encryptionForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    const metadata: Metadata = this.encryptionForm.value.metadata;
    let data: VideoData | null = null;

    if (this.encryptionForm.get('dataType')?.value === 'Video') {
      const videoGroup = this.encryptionForm.get('data')?.get('video') as FormGroup;
      data = {
        videoUrl: videoGroup.value.videoUrl,
        screenSize: videoGroup.value.screenSize,
        htmlFileUrl: videoGroup.value.htmlFileUrl,
        ccFileUrl: videoGroup.value.ccFileUrl,
        jsonData: videoGroup.value.jsonData as VideoPart[],
      };
    }

    const payload: EncryptedPayload = {
      metadata,
      data,
    };

    this.encryptedData = this.encryptionService.encryptData(payload);
  }

  // Decrypt Function
  decrypt(): void {
    if (this.decryptionForm.invalid) {
      alert('Please enter the encrypted data.');
      return;
    }

    const encryptedInput = this.decryptionForm.value.encryptedData;
    const result = this.encryptionService.decryptData(encryptedInput);
    this.decryptionResult = result.valid ? result.data : 'Invalid or expired data.';
  }
}
