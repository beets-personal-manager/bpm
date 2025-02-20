import {ApplicationConfig, InjectionToken, provideZoneChangeDetection} from '@angular/core';
import {provideRouter, withRouterConfig} from '@angular/router';

import { routes } from './app.routes';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {provideHttpClient, withFetch} from '@angular/common/http';
import {MAT_INPUT_CONFIG} from '@angular/material/input';
import {MAT_FORM_FIELD_DEFAULT_OPTIONS} from '@angular/material/form-field';
import {MAT_CARD_CONFIG} from '@angular/material/card';

export const APPLICATION_NAME = new InjectionToken<string>('APPLICATION_NAME');

export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes, withRouterConfig({
            onSameUrlNavigation: 'reload',
        })),
        provideAnimationsAsync(),
        provideHttpClient(withFetch()),
        { provide: APPLICATION_NAME, useValue: 'BPM' },
        { provide: MAT_FORM_FIELD_DEFAULT_OPTIONS, useValue: {appearance: 'outline', subscriptSizing: 'dynamic'} },
        { provide: MAT_CARD_CONFIG, useValue: {appearance: 'outlined'} },
    ],
};
