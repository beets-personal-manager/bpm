import {AfterViewInit, Component, computed, DestroyRef, inject, input, Input, signal, viewChild} from '@angular/core';
import {MatSort, MatSortModule, Sort} from '@angular/material/sort';
import {MatTableModule} from '@angular/material/table';
import {MatChipsModule} from '@angular/material/chips';
import {MatListModule} from '@angular/material/list';
import {AsyncPipe} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {BehaviorSubject, combineLatest, filter, map, Observable, startWith} from 'rxjs';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {CollectionViewer, DataSource} from '@angular/cdk/collections';

@Component({
    selector: 'app-stats-card',
    imports: [
        MatCardModule,
        MatListModule,
        MatChipsModule,
        MatTableModule,
        MatSortModule,
    ],
    templateUrl: './stats-card.component.html',
    styleUrl: './stats-card.component.scss',
    standalone: true,
})
export class StatsCardComponent implements AfterViewInit {
    title = input.required<string>();

    data = input.required<StatsCardData>();
    readonly tableData = new TableDatasource(toObservable(this.data));
    readonly hasData = computed(() => {
        const v = this.data();
        return !!v && !!v.table && !!v.table.data;
    });

    private readonly sort = viewChild.required(MatSort);

    ngAfterViewInit() {
        this.tableData.sort = this.sort();
    }
}

class TableDatasource extends DataSource<[string, number]> {
    readonly columns = signal<string[]>([]);
    private readonly $columns = toObservable(this.columns);
    private readonly original = new BehaviorSubject<[string, number][]>([]);
    private readonly data = new BehaviorSubject<[string, number][]>([]);
    private readonly destroyRef = inject(DestroyRef);

    constructor(
        dataSource: Observable<StatsCardData>
    ) {
        super();
        dataSource.pipe(
            takeUntilDestroyed(),
            map(v => v.table),
            filter(v => !!v),
        ).subscribe(({headers, data}) => {
            this.columns.set(headers);
            this.original.next(data);
        });
    }

    override connect(collectionViewer: CollectionViewer): Observable<readonly [string, number][]> {
        return this.data.asObservable();
    }

    override disconnect(collectionViewer: CollectionViewer): void {
        this.data.complete();
    }

    set sort(sortable: MatSort) {
        combineLatest([
            this.original,
            this.$columns,
        ]).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(([_, columns]) => columns),
            filter(columns => columns.length > 0),
            map(columns => columns[columns.length-1]),
        ).subscribe(id => sortable.sort({
            disableClear: false,
            id,
            start: 'desc',
        }));

        combineLatest([
            sortable.sortChange.pipe(
                startWith({
                    direction: '',
                    active: '',
                } as Sort),
            ),
            this.original,
            this.$columns,
        ]).pipe(
            takeUntilDestroyed(this.destroyRef),
            map(([sort, data, columns]) => ({sort, data, columns})),
        ).subscribe(({sort, data, columns}) => {
            if (sort.direction === '') {
                this.data.next(data);
                return
            }

            const idx = columns.findIndex(v => v === sort.active);
            if (idx < 0) {
                return;
            }

            const sorted = [...data].sort((a, b) => {
                switch (typeof a[idx]) {
                    case 'string':
                        return a[idx].localeCompare(b[idx] as string);
                    case 'number':
                        return (a[idx] - (b[idx] as number));
                    default:
                        throw new Error('invalid type');
                }
            });

            if (sort.direction === 'desc') {
                sorted.reverse();
            }

            this.data.next(sorted);
        });
    }
}

export type StatsCardData = {
    data: Array<[string, string]>;
    table?: {
        headers: [string, string];
        data: Array<[string, number]>;
    }
};
