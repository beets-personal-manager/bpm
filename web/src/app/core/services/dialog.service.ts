import {DestroyRef, inject, Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {ComponentType} from '@angular/cdk/overlay';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {first, map, Observable} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class DialogService {
    private readonly matDialog = inject(MatDialog);
    private readonly destroyRef = inject(DestroyRef);

    openDialog<R, T>(c: ComponentType<T>, data: any): Observable<R> {
        return this.matDialog.open(c, {
            data,
            minWidth: '50vw',
        }).afterClosed().pipe(
            takeUntilDestroyed(this.destroyRef),
            first(),
        );
    }
}
