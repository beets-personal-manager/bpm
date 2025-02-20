import {Component, computed, inject, input} from '@angular/core';
import {TapsDirective} from '../../../../core/directives/taps.directive';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {ApiLogsService, LogListing} from '../../../../core/services/api/api-logs.service';
import {SnackbarService} from '../../../../core/services/snackbar.service';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
    selector: 'app-logs-toolbar-download',
    imports: [
        MatButtonModule,
        MatIconModule,
        TapsDirective,
        MatTooltipModule,
    ],
    styleUrl: './logs-toolbar-download.component.scss',
    standalone: true,
    template: `
        <button mat-icon-button matTooltip="Download" [disabled]="disabled()" [class.import-color]="!disabled()" appTaps (tap)="download()" (click)="download()">
            <mat-icon>download</mat-icon>
        </button>
    `,
})
export class LogsToolbarDownloadComponent {
    readonly selectedLogs = input<LogListing[]>([]);
    readonly disabled = computed(() => this.selectedLogs().length !== 1);
    private readonly logsService = inject(ApiLogsService);
    private readonly snackbarService = inject(SnackbarService);


    async download() {
        const selected = this.selectedLogs()?.[0];
        if (selected) {
            await this.logsService.log(selected.kind, selected.time, selected.id).then(() => {
                this.snackbarService.success('Download started');
            }).catch(err => {
                this.snackbarService.error('Download failed');
            });
        }
    }
}
