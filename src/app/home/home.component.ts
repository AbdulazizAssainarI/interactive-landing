import { Component, Inject, PLATFORM_ID } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { routes } from '../app.routes';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [
    RouterModule,
    CommonModule,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent {
  title = 'interactive-video-landing';
  appRoutes: Routes = [];

  constructor(
    private router: Router,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.appRoutes = routes.filter(route => route.path);
    }
  }
}
