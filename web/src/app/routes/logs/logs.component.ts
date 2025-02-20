import {Component, inject, Injectable, InjectionToken, Injector, input} from '@angular/core';
import {DataTableComponent} from '../../core/components/data-table/data-table.component';
import {ToolbarSenderDirective} from '../../core/directives/toolbar/toolbar-sender.directive';
import {MatTableModule} from '@angular/material/table';
import {MatSortModule} from '@angular/material/sort';
import {AsyncPipe, DatePipe, NgTemplateOutlet} from '@angular/common';
import {PrettyBytesPipe} from '../../core/pipes/pretty-bytes.pipe';
import {LogsDatasource} from './logs.datasource';
import {LogsToolbarDownloadComponent} from './logs-toolbar/logs-toolbar-download/logs-toolbar-download.component';
import {DataTableDataSource} from '../../core/components/data-table/data-table-datasource';
import {
    DeleteConfirmComponent, Deleter
} from '../../core/components/delete-confirm/delete-confirm.component';
import {ApiLogsService, LogListing} from '../../core/services/api/api-logs.service';
import {Observable} from 'rxjs';

@Component({
    selector: 'app-logs',
    imports: [
        DataTableComponent,
        ToolbarSenderDirective,
        MatTableModule,
        MatSortModule,
        DatePipe,
        PrettyBytesPipe,
        LogsToolbarDownloadComponent,
        AsyncPipe,
        NgTemplateOutlet,
        DeleteConfirmComponent,
    ],
    templateUrl: './logs.component.html',
    styleUrl: './logs.component.scss',
    standalone: true,
})
export class LogsComponent {
    readonly dataSource = new LogsDatasource();
    readonly dataSourceSelected = new DataTableDataSource(true, this.dataSource.selectedData$);
    readonly logDeleter = new class implements Deleter<LogListing>{
        private readonly logsService = inject(ApiLogsService);

        name(l: LogListing): string {
            return l.name;
        }

        delete(l: LogListing): Observable<void> {
            return this.logsService.deleteLog(l.id);
        }
    }();
}
