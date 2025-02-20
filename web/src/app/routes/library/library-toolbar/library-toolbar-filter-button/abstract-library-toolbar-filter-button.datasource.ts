import {DataTableDataSource} from '../../../../core/components/data-table/data-table-datasource';
import {DestroyRef, inject} from '@angular/core';
import {ActivatedRoute, convertToParamMap} from '@angular/router';
import {combineLatest, EMPTY, finalize, map, startWith} from 'rxjs';
import {LibraryParams} from '../../../../core/services/api/api-library.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Resolver} from '../../../../core/util/resolvable';
import {NavService} from '../../../../core/services/nav.service';

export abstract class AbstractLibraryToolbarFilterButtonDatasource extends DataTableDataSource<string> {
    protected constructor(
        resolver: Resolver<string[]>,
        multiple: boolean,
        param: LibraryParams,
        activatedRoute = inject(ActivatedRoute),
        navService = inject(NavService),
        destroyRef = inject(DestroyRef),
    ) {
        super(multiple, resolver.resolve(navService.routeData(activatedRoute)).pipe(takeUntilDestroyed(destroyRef)));

        combineLatest({
            data: this.connect(),
            params: activatedRoute.queryParams.pipe(
                map(params => new Set<string>(convertToParamMap(params).getAll(param))),
                map(s => {
                    const values = [...s];
                    while (!multiple && s.size > 1) {
                        s.delete(values.shift() ?? '');
                    }
                    return s;
                }),
                startWith(new Set<string>()),
            ),
        }).pipe(
            takeUntilDestroyed(destroyRef),
        ).subscribe(({data, params}) => {
            this.clearSelection();
            data.filter(d => params.has(d)).forEach(ik => this.toggleSelection(ik));
        });
    }
}
