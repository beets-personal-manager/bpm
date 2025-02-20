import {Component, computed, DestroyRef, inject, input} from '@angular/core';
import {MatDialogModule} from '@angular/material/dialog';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {TapsDirective} from '../../../../core/directives/taps.directive';
import {FilesDatasource} from '../../files.datasource';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {EmptyError, first, map, switchMap} from 'rxjs';
import {SnackbarService} from '../../../../core/services/snackbar.service';
import {NavService} from '../../../../core/services/nav.service';
import {FilesToolbarImportDialogComponent} from './files-toolbar-import-dialog/files-toolbar-import-dialog.component';
import {DialogService} from '../../../../core/services/dialog.service';
import {ApiQueueService, StartImport, StartKind} from '../../../../core/services/api/api-queue.service';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
    selector: 'app-files-toolbar-import',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        TapsDirective,
        MatTooltipModule,
    ],
    styleUrl: './files-toolbar-import.component.scss',
    standalone: true,
    template: `
        <button mat-icon-button matTooltip="Import" [disabled]="disabled()" [class.import-color]="!disabled()" appTaps (tap)="openDialog()" (click)="openDialog()">
            <mat-icon>add</mat-icon>
        </button>
    `,
})
export class FilesToolbarImportComponent {
    readonly currentPath = input.required<string[]>();
    readonly queries = input.required<string[]>();
    readonly libraries = input.required<string[]>();
    readonly dataSource = input.required<FilesDatasource>();

    private readonly selected = toSignal(toObservable(this.dataSource).pipe(
        switchMap(ds => ds.selectedData$),
        map(sd => sd.length === 1 ? sd[0] : undefined),
    ));
    readonly disabled = computed(() => this.selected() === undefined);

    private readonly dialogService = inject(DialogService);
    private readonly snackBar = inject(SnackbarService);
    private readonly navService = inject(NavService);
    private readonly destroyRef = inject(DestroyRef);

    private readonly apiQueue = inject(ApiQueueService);

    openDialog() {
        this.dialogService.openDialog<StartImport, FilesToolbarImportDialogComponent>(FilesToolbarImportDialogComponent, {
            path: [
                ...this.currentPath(),
                ...[this.selected()?.name].filter(v => v !== undefined),
            ],
            importFile: this.selected(),
            libraries: this.libraries() ?? [],
            queries: this.queries() ?? [],
        }).pipe(
            takeUntilDestroyed(this.destroyRef),
            first(v => !!v),
            switchMap((v: StartImport)=> this.apiQueue.start(StartKind.import, v)),
        ).subscribe({
            error: err => {
                if (!(err instanceof EmptyError)) {
                    this.navService.reload().then(() => {
                        this.snackBar.error('Failed to submit import');
                    });
                }
                console.error(err);
            },
            next: () => {
                this.navService.reload().then(() => {
                    this.snackBar.success('Import submitted');
                });
            },
        });
    }
}
