import {DataTableDataSource} from '../../../core/components/data-table/data-table-datasource';
import {LibraryListing} from '../../../core/services/api/api-library.service';
import {libraryResolver} from '../../../core/resolvers/library.resolver';
import {inject} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {map, switchMap, tap} from 'rxjs';
import {NavService} from '../../../core/services/nav.service';

export class LibraryDetailsDatasource extends DataTableDataSource<LibraryListing> {
    constructor() {
        super(true, libraryResolver.resolve(inject(NavService).routeData()).pipe(
            takeUntilDestroyed(),
            switchMap(o => o),
        ));
    }
}
