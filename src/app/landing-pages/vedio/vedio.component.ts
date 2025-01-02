import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoData, VideoPart } from '../../shared/interfaces/video-data.model';
import { EncryptionService } from '../../services/encryption/encryption.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EncryptedPayload } from '../../shared/interfaces/data.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel

@Component({
  selector: 'app-vedio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './vedio.component.html',
  styleUrls: ['./vedio.component.scss'],
})
export class VedioComponent implements OnInit {
  validatedPayload: { valid: boolean; data: EncryptedPayload | null } | null = null;
  videoData: VideoData | null = null;
  currentHtmlContent: string | null = null;
  valid: boolean = false;
  errorMessage: string | null = null;

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // Additional properties for controls
  currentTime: number = 0;
  videoDuration: number = 0;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private encryptionService: EncryptionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe({
        next: (params) => this.handleDecryption(params['data']),
        error: (error) => this.handleError('Failed to retrieve query parameters.', error),
      });
    }
  }
  
  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId)) {
      const video = document.getElementById('myVideo') as HTMLVideoElement;
      const floatingContainer = document.getElementById('floatingContainer') as HTMLElement;
      const controlsContainer = document.getElementById('controlsContainer') as HTMLElement;

      video.addEventListener('loadeddata', () => {
        floatingContainer.style.width = `${video.videoWidth}px`;
        floatingContainer.style.height = `${video.videoHeight}px`;

        const rect = video.getBoundingClientRect();
        floatingContainer.style.left = `${rect.left}px`;
        floatingContainer.style.top = `${rect.top}px`;

        // Set controlsContainer width and position
        const con = controlsContainer.getBoundingClientRect();
        controlsContainer.style.width = `${video.videoWidth}px`;
        controlsContainer.style.position = 'absolute';
        controlsContainer.style.top = `${rect.top + rect.height - con.height}px`;
        controlsContainer.style.left = `${rect.left}px`;
      });
    }
  }

  private handleDecryption(encryptedData: string | undefined): void {
    if (!encryptedData) {
      this.setErrorMessage('No data provided in the URL.');
      return;
    }

    try {
      this.validatedPayload = this.encryptionService.decryptData(encryptedData);

      if (!this.validatedPayload || !this.validatedPayload.data) {
        this.setErrorMessage('Failed to decrypt the payload.');
        return;
      }

      this.valid = this.validatedPayload.valid;

      if (this.valid && this.validatedPayload.data) {
        const payload = this.validatedPayload.data;

        if (payload.data && 'videoUrl' in payload.data) {
          this.videoData = payload.data as VideoData;
          console.log('Video Data:', this.videoData);
        } else {
          this.setErrorMessage('Decrypted data is not valid for a video.');
        }
      } else {
        this.setErrorMessage('The data is no longer valid.');
      }
    } catch (error) {
      this.handleError('Error decrypting data.', error);
    }
  }

  private setErrorMessage(message: string): void {
    this.errorMessage = message;
    this.valid = false;
    this.videoData = null;
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.setErrorMessage(message);
  }

  // External Control Methods
  playVideo(): void {
    this.videoPlayer.nativeElement.play();
  }

  pauseVideo(): void {
    this.videoPlayer.nativeElement.pause();
  }

  seekVideo(time: number): void {
    this.videoPlayer.nativeElement.currentTime = time;
  }

  onTimeUpdate(event: Event): void {
    const video = this.videoPlayer.nativeElement;
    this.currentTime = video.currentTime;
    this.videoDuration = video.duration;

    if (!this.videoData || !this.videoData.jsonData) return;

    // Find the current part based on the video time
    const currentPart: VideoPart | undefined = this.videoData.jsonData.find(
      (part) => this.currentTime >= part.startTime && this.currentTime <= part.endTime
    );

    // Load and display the HTML content for the current part
    if (currentPart && currentPart.htmlFileUrl) {
      this.loadHtmlContent(currentPart.htmlFileUrl);
    }
  }

  private loadHtmlContent(htmlFileUrl: string): void {
    if (this.currentHtmlContent !== htmlFileUrl) {
      fetch(htmlFileUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to load HTML file: ${response.statusText}`);
          }
          return response.text();
        })
        .then((html) => {
          this.currentHtmlContent = html;
        })
        .catch((error) => {
          console.error('Error loading HTML content:', error);
          this.currentHtmlContent = '<p>Error loading content.</p>';
        });
    }
  }

  onLoadedMetadata(event: Event): void {
    const video = this.videoPlayer.nativeElement;
    this.videoDuration = video.duration;
  }

  onVideoError(event: Event): void {
    this.setErrorMessage('Error loading the video.');
  }
  
  onVideoClick(event: Event): void {
    const video = this.videoPlayer.nativeElement;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  }

  adjustTime(seconds: number) {
    const video = document.getElementById('myVideo') as HTMLVideoElement;
    if (video) {
      video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
    }
  }
}
