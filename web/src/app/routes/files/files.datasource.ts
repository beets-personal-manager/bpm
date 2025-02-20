import {DataTableDataSource} from '../../core/components/data-table/data-table-datasource';
import {LogListing} from '../../core/services/api/api-logs.service';
import {logsResolver} from '../../core/resolvers/logs.resolver';
import {inject} from '@angular/core';
import {NavService} from '../../core/services/nav.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {BrowseListing} from '../../core/services/browse.service';
import {browseFilesResolver} from '../../core/resolvers/browse-files.resolver';
import {switchMap, tap} from 'rxjs';

export class FilesDatasource extends DataTableDataSource<BrowseListing> {
    constructor() {
        super(true, browseFilesResolver.resolve(inject(NavService).routeData()).pipe(
            takeUntilDestroyed(),
            switchMap(o => o),
        ));
    }
}
