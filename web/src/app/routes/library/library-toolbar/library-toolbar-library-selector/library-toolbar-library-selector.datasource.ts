import {DataTableDataSource} from '../../../../core/components/data-table/data-table-datasource';
import {DestroyRef, inject} from '@angular/core';
import {ActivatedRoute, convertToParamMap} from '@angular/router';
import {fieldsResolver} from '../../../../core/resolvers/fields.resolver';
import {combineLatest, EMPTY, finalize, map, startWith, tap} from 'rxjs';
import {LibraryParams} from '../../../../core/services/api/api-library.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {
    AbstractLibraryToolbarFilterButtonDatasource
} from '../library-toolbar-filter-button/abstract-library-toolbar-filter-button.datasource';
import {librariesResolver} from '../../../../core/resolvers/libraries.resolver';

export class LibraryToolbarLibrarySelectorDatasource extends AbstractLibraryToolbarFilterButtonDatasource {
    constructor() {
        super(librariesResolver, false, LibraryParams.Library);
    }
}
