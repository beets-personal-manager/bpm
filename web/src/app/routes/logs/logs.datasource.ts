import {DataTableDataSource} from '../../core/components/data-table/data-table-datasource';
import {LibraryListing} from '../../core/services/api/api-library.service';
import {libraryResolver} from '../../core/resolvers/library.resolver';
import {inject} from '@angular/core';
import {NavService} from '../../core/services/nav.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';
import {ApiLogsService, LogListing} from '../../core/services/api/api-logs.service';
import {logsResolver} from '../../core/resolvers/logs.resolver';

export class LogsDatasource extends DataTableDataSource<LogListing> {
    constructor() {
        super(true, logsResolver.resolve(inject(NavService).routeData()).pipe(
            takeUntilDestroyed(),
        ));
    }
}
