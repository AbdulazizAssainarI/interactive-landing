import { Component, OnInit, ViewChild, ElementRef, Inject, PLATFORM_ID } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { VideoData, VideoPart } from '../../shared/interfaces/video-data.model';
import { EncryptionService } from '../../services/encryption/encryption.service';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { EncryptedPayload } from '../../shared/interfaces/data.model';
import { BrowserModule, DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-video',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
  ],
  templateUrl: './video.component.html',
  styleUrls: ['./video.component.scss'],
})
export class VideoComponent implements OnInit {
  validatedPayload: { valid: boolean; data: EncryptedPayload | null } | null = null;
  videoData: VideoData | null = null;
  currentHtmlContent: SafeHtml | null = null;
  valid: boolean = false;
  errorMessage: string | null = null;
  private lastLoadedHtmlFileUrl: string | null = null;

  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  // Additional properties for controls
  currentTime: number = 0;
  videoDuration: number = 0;

  constructor(
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private encryptionService: EncryptionService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) { }

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.route.queryParams.subscribe({

        next: (params) => {
          this.handleDecryption(params['data'])
        },
        error: (error) => this.handleError('Failed to retrieve query parameters.', error),
      });
    }
  }

  ngAfterViewInit() {
    if (isPlatformBrowser(this.platformId) && this.videoData == null) {
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
      encryptedData = '';
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

    if (!this.videoData || !this.videoData.videoParts) return;

    // Find the current part based on the video time
    const currentPart: VideoPart | undefined = this.videoData.videoParts.find(
      (part) => this.currentTime >= part.startTime && this.currentTime <= part.endTime
    );

    // Load and display the HTML content for the current part
    if (currentPart && currentPart.htmlFileUrl && currentPart.htmlFileUrl !== this.lastLoadedHtmlFileUrl) {
      this.loadHtmlContent(currentPart.htmlFileUrl);
      this.lastLoadedHtmlFileUrl = currentPart.htmlFileUrl;
      this.checkStatusAndAlert();
    } else if (!currentPart) {
      this.clearHtmlContent();
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
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');

          // Extract and append styles
          const styles = doc.querySelectorAll('style');
          styles.forEach((style) => {
            const styleElement = document.createElement('style');
            styleElement.textContent = style.textContent;
            document.head.appendChild(styleElement);
          });

          // Extract and append scripts
          const scripts = doc.querySelectorAll('script');
          scripts.forEach((script) => {
            const scriptElement = document.createElement('script');
            scriptElement.textContent = script.textContent;
            document.body.appendChild(scriptElement);
          });

          // Set HTML content
          const bodyContent = doc.body.innerHTML;
          this.currentHtmlContent = this.sanitizer.bypassSecurityTrustHtml(bodyContent);
        })
        .catch((error) => {
          console.error('Error loading HTML content:', error);
          this.currentHtmlContent = '<p>Error loading content.</p>';
        });
    }
  }

  private clearHtmlContent(): void {
    this.currentHtmlContent = '';
  }

  private checkStatusAndAlert(): void {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      const status = statusElement.textContent;
      if (status) {
        console.log('Status:', status);
        if (status === 'false') {
          const checkbox = document.getElementById('togglePauseCheckbox') as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = false;
            this.pauseVideo();
          }
        }
        else {
          const checkbox = document.getElementById('togglePauseCheckbox') as HTMLInputElement;
          if (checkbox) {
            checkbox.checked = true;
            this.playVideo();
          }
        }
      }
      else {
        const checkbox = document.getElementById('togglePauseCheckbox') as HTMLInputElement;
        if (checkbox) {
          checkbox.checked = true;
          this.playVideo();
        }
      }
    }
  }

  togglePause(event: Event): void {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      this.playVideo();
    } else {
      this.pauseVideo();
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
    if (video.paused && (document.getElementById('togglePauseCheckbox') as HTMLInputElement).checked) {
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
