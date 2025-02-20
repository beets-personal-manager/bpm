import {
    Component,
    computed,
    DestroyRef, Inject,
    inject,
    InjectionToken,
    input,
    SkipSelf,
    TemplateRef,
    viewChild
} from '@angular/core';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatButtonModule, MatIconButton} from '@angular/material/button';
import {TapsDirective} from '../../directives/taps.directive';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {NavService} from '../../services/nav.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {catchError, EMPTY, EmptyError, filter, finalize, first, forkJoin, map, Observable, switchMap, take} from 'rxjs';
import {DeleteConfirmDialogComponent} from './delete-confirm-dialog/delete-confirm-dialog.component';
import {HttpErrorResponse} from '@angular/common/http';
import {SnackbarService} from '../../services/snackbar.service';
import {ToolbarSenderDirective} from '../../directives/toolbar/toolbar-sender.directive';
import {DialogService} from '../../services/dialog.service';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
    selector: 'span[app-delete-confirm]',
    imports: [
        MatButtonModule,
        MatIconModule,
        TapsDirective,
        ToolbarSenderDirective,
        MatTooltipModule,
    ],
    styleUrl: './delete-confirm.component.scss',
    standalone: true,
    template: `
        <ng-template #dataTableTemplate>
            <ng-content></ng-content>
        </ng-template>
        <ng-template [appToolbarSender]="toolbarIndex()">
            <button matTooltip="Delete" mat-icon-button [disabled]="disabled()" [class.delete-color]="!disabled()" appTaps (tap)="openDialog()" (click)="openDialog()">
                <mat-icon>delete</mat-icon>
            </button>
        </ng-template>
    `,
})
export class DeleteConfirmComponent<T> {
    readonly toolbarIndex = input(0);
    readonly selected = input<T[]>([]);
    readonly disabled = computed(() => this.selected().length === 0);
    readonly dataTable = viewChild.required<TemplateRef<any>>('dataTableTemplate');
    readonly deleter = input.required<Deleter<T>>();

    private readonly dialogService = inject(DialogService);
    private readonly snackBar = inject(SnackbarService);
    private readonly navService = inject(NavService);
    private readonly destroyRef = inject(DestroyRef);

    openDialog() {
        const errors = Array<string>();
        this.dialogService.openDialog<T[], DeleteConfirmDialogComponent<T>>(DeleteConfirmDialogComponent, {
            selected: this.selected(),
            dataTable: this.dataTable(),
        }).pipe(
            takeUntilDestroyed(this.destroyRef),
            filter(Array.isArray),
            switchMap((v: T[])=> {
                return forkJoin(v.map(e => this.deleter().delete(e).pipe(
                    catchError(err => {
                        if (err instanceof HttpErrorResponse) {
                            errors.push(`Failed to delete ${this.deleter().name(e)}, ${err.statusText}(${err.status}): ${err.error}`);
                        } else {
                            errors.push(`Failed to delete ${this.deleter().name(e)}`);
                        }
                        return EMPTY;
                    }),
                ))).pipe(
                    map(a => a.length),
                );
            }),
        ).subscribe({
            error: err => {
                if (!(err instanceof EmptyError)) {
                    this.navService.reload().then(() => this.snackBar.error('Failed to delete'));
                }
                console.error(err);
            },
            next: len => {
                this.navService.reload().then(() => {
                    if (errors.length === 0) {
                        this.showDeleteSuccess(len);
                    } else {
                        this.showDeleteErrors(errors);
                    }
                });
            },
        });
    }

    private showDeleteSuccess(n: number) {
        this.snackBar.success(`${n} item(s) deleted`);
    }

    private showDeleteErrors(errors: string[]) {
        if (errors.length > 0) {
            this.snackBar.error(errors?.[0] ?? '').pipe(
                takeUntilDestroyed(this.destroyRef),
            ).subscribe(() => {
                this.showDeleteErrors(errors.slice(1));
            });
        }
    }
}

export interface Deleter<T> {
    name(_: T): string;
    delete(_: T): Observable<void>;
}
