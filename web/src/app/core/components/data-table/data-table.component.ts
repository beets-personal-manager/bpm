import {
    Component,
    computed,
    contentChild,
    contentChildren,
    input,
    output,
    signal,
    viewChild
} from '@angular/core';
import {MatColumnDef, MatTable, MatTableModule} from '@angular/material/table';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSort, MatSortModule} from '@angular/material/sort';
import {DataTableDataSource} from './data-table-datasource';
import {combineLatest, filter, interval, map, pairwise, startWith} from 'rxjs';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {AsyncPipe} from '@angular/common';
import {TapsDirective} from '../../directives/taps.directive';
import {SelectButtonComponent} from '../select-button.component';

@Component({
    selector: 'app-data-table',
    imports: [
        MatTableModule,
        MatCheckboxModule,
        TapsDirective,
        MatSortModule,
        SelectButtonComponent,
    ],
    templateUrl: './data-table.component.html',
    styleUrl: './data-table.component.scss',
    standalone: true,
})
export class DataTableComponent<T> {
    readonly dataSource = input.required<DataTableDataSource<T>>();
    readonly allowSelect = input<boolean>(true);
    readonly allowActivate = input(true);
    readonly onRowActivate = output<T>();

    private readonly baseColumns = signal<string[]>([]);
    readonly displayedColumns = computed(() => {
        const baseColumns = this.baseColumns();
        if (this.allowSelect()) {
            return ['select', ...baseColumns];
        }
        return baseColumns;
    });

    private readonly sort = contentChild(MatSort);
    private readonly table = viewChild(MatTable);
    private readonly columns = contentChildren(MatColumnDef);


    constructor() {
        this.setSort();
        this.setColumns();
    }

    private setSort() {
        combineLatest({
            dataSource: toObservable(this.dataSource).pipe(
                filter(v => !!v),
            ),
            sort: toObservable(this.sort).pipe(
                filter(v => !!v),
            ),
        }).pipe(
            takeUntilDestroyed(),
        ).subscribe(({dataSource, sort}) => {
            dataSource.sort = sort;
        });
    }

    private setColumns() {
        combineLatest({
            table: toObservable(this.table),
            columns: toObservable(this.columns).pipe(
                startWith(undefined),
                pairwise(),
                map(([prevCols, currCols]) => ({
                    prevCols: prevCols?.filter(v => v.name !== 'select'),
                    currCols: currCols?.filter(v => v.name !== 'select'),
                })),
            ),
        }).pipe(
            takeUntilDestroyed(),
        ).subscribe(({table, columns: {prevCols, currCols}}) => {
            prevCols?.forEach(col => table?.removeColumnDef(col));
            currCols?.forEach(col => table?.addColumnDef(col));
            this.baseColumns.set(currCols?.map(v => v.name) ?? []);
        });
    }

    activateRow(row: any) {
        if (this.allowActivate()) {
            this.onRowActivate.emit(row);
        }
    }
}
