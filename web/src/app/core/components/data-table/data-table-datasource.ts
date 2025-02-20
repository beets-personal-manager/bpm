import {SelectionModel} from '@angular/cdk/collections';
import {
    BehaviorSubject,
    combineLatest, distinctUntilChanged, from,
    map,
    Observable,
    startWith, Subject,
} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {MatTableDataSource} from '@angular/material/table';
import {unorderedEquals} from '../../util/unordered-equals';

export class DataTableDataSource<T> extends MatTableDataSource<T> {
    private readonly selection!: SelectionModel<T>;
    readonly isAllSelected!: ValueSubject<boolean>;
    readonly isNoneSelected!: ValueSubject<boolean>;
    readonly isIndeterminate!: ValueSubject<boolean>;

    constructor(
        multiple: boolean,
        dataSource: Observable<T[]>,
    ) {
        super([]);
        this.selection = new SelectionModel<T>(multiple, []);
        this.setData(dataSource);
        ({
            isAllSelected: this.isAllSelected,
            isNoneSelected: this.isNoneSelected,
            isIndeterminate: this.isIndeterminate,
        } = this.setIsSelecteds());
        this.unselectNotExists();
    }

    private unselectNotExists() {
        combineLatest({
            data: this.connect().pipe(
                distinctUntilChanged(unorderedEquals),
                map(data => new Set<T>(data)),
            ),
            selected: this.selectedData$.pipe(
                distinctUntilChanged(unorderedEquals),
            ),
        }).pipe(
            takeUntilDestroyed(),
        ).subscribe(({data, selected}) => {
            this.selection.deselect(...selected.filter(v => !data.has(v)));
        });
    }

    private setData(dataSource: Observable<T[]>) {
        dataSource.pipe(
            takeUntilDestroyed(),
        ).subscribe(data => {
            this.data = data;
        });
    }

    private setIsSelecteds(): {
        isAllSelected: ValueSubject<boolean>;
        isNoneSelected: ValueSubject<boolean>;
        isIndeterminate: ValueSubject<boolean>;
    } {
        const selection = combineLatest({
            selected: this.selectedData$.pipe(map(a => a.length)),
            data: this.connect().pipe(map(a => a.length)),
        }).pipe(
            takeUntilDestroyed(),
        );

        const isAllSelected = new BehaviorSubject(false);
        selection.pipe(
            map(({selected, data}) => selected === data),
        ).subscribe(isAllSelected);

        const isNoneSelected = new BehaviorSubject(true);
        selection.pipe(
            map(({selected}) => selected === 0),
        ).subscribe(isNoneSelected);

        const isIndeterminate = new BehaviorSubject(false);
        selection.pipe(
            map(({selected, data}) => selected > 0 && selected !== data),
        ).subscribe(isIndeterminate);

        return {isAllSelected, isNoneSelected, isIndeterminate};
    }

    clearSelection() {
        this.selection.clear();
    }

    toggleSelection(row?: T) {
        if (row !== undefined && row !== null) {
            this.selection.toggle(row);
        } else if (this.isAllSelected.value) {
            this.selection.clear();
        } else {
            this.selection.select(...this.data)
        }
    }

    isSelected(row?: T): boolean {
        if (row !== undefined && row !== null) {
            return this.selection.isSelected(row);
        }
        return this.selection.hasValue();
    }

    get selectedData$(): Observable<T[]> {
        return this.selection.changed.pipe(
            map(v => v.source.selected),
            startWith(this.selection.selected),
        );
    }

    get selectedData(): T[] {
        return this.selection.selected;
    }
}

export type ValueSubject<T> = Subject<T> & {
    get value(): T;
}
