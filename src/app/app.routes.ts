import { Routes } from '@angular/router';
import { DynamicEncryptionComponent } from './dynamic-encryption/dynamic-encryption.component';
import { VedioComponent } from './landing-pages/vedio/vedio.component';
import { HomeComponent } from './home/home.component';

export const routes: Routes = [
  { path: 'main', component: HomeComponent },
  { path: 'video', component: VedioComponent },
  { path: 'encrypt', component: DynamicEncryptionComponent },

  { path: '', redirectTo: '/main', pathMatch: 'full' },
  { path: '**', redirectTo: '/main' },
];
