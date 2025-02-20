import {inject, Injectable, InjectionToken} from '@angular/core';
import {MatSnackBar} from '@angular/material/snack-bar';
import {map, Observable} from 'rxjs';

export const SNACKBAR_TIMEOUT = new InjectionToken<number>('SNACKBAR_TIMEOUT', {factory: () => 2500});

@Injectable({
    providedIn: 'root',
})
export class SnackbarService {
    private readonly snackbar = inject(MatSnackBar);
    private readonly snackbarTimeout = inject(SNACKBAR_TIMEOUT);

    success(text: string) {
        return this.show(text);
    }

    error(text: string) {
        return this.show(text, 'snackbar-error');
    }

    private show(text: string, ...classes: string[]): Observable<void> {
        return this.snackbar.open(text, '', {
            duration: this.snackbarTimeout,
            panelClass: classes,
        }).afterDismissed().pipe(
            map(() => {}),
        );
    }
}
