import {Component, computed, effect, HostListener, input} from '@angular/core';
import {TapsDirective} from '../directives/taps.directive';
import {MatButtonModule} from '@angular/material/button';
import {MatRadioModule} from '@angular/material/radio';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {AsyncPipe} from '@angular/common';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {combineLatest, isObservable, map, of, switchMap, tap} from 'rxjs';
import {DataTableDataSource} from './data-table/data-table-datasource';

@Component({
    selector: 'app-select-button',
    imports: [
        TapsDirective,
        MatButtonModule,
        MatCheckboxModule,
        MatRadioModule,
    ],
    styles: [],
    standalone: true,
    template: `
        @if (radio()) {
            <mat-radio-button
                [checked]="isChecked()"
                [disabled]="isDisabled()"
                appTaps
                (tap)="toggle(data())">
            </mat-radio-button>
        } @else {
            <mat-checkbox
                [indeterminate]="isIndeterminate()"
                [checked]="isChecked()"
                [disabled]="isDisabled()"
                appTaps
                (tap)="toggle(data())">
            </mat-checkbox>
        }
        @let txt = text();
        @if (txt !== undefined) {
            {{ txt }}
        }
    `,
    hostDirectives: [
        {
            directive: TapsDirective,
            outputs: ['tap'],
        },
    ],
})
export class SelectButtonComponent<T> {
    readonly radio = input(false);
    readonly indeterminate = input(true);

    readonly text = input<string>();
    readonly data = input<T>();
    readonly selectable = input.required<DataTableDataSource<T>>();

    private readonly inputs = computed(() => ({
        isAllSelector: this.data() === undefined,
        data: this.data(),
        selectable: this.selectable(),
        radio: this.radio(),
        indeterminate: this.indeterminate(),
    }));

    private readonly isAllSelected = toSignal(toObservable(this.selectable).pipe(
        switchMap(v => v.isAllSelected),
    ), {initialValue: false});
    private readonly isNoneSelected = toSignal(toObservable(this.selectable).pipe(
        switchMap(v => v.isNoneSelected),
    ), {initialValue: false});
    private readonly isIndeterminateSelected = toSignal(toObservable(this.selectable).pipe(
        switchMap(v => v.isIndeterminate),
    ), {initialValue: false});
    private readonly isSelecteds = computed(() => ({
        isIndeterminateSelected: this.isIndeterminateSelected(),
        isAllSelected: this.isAllSelected(),
        isNoneSelected: this.isNoneSelected(),
    }));

    private readonly isSelected = toSignal(toObservable(computed(() => {
        const {selectable, data, isAllSelector} = this.inputs();
        return selectable.selectedData$.pipe(
            map(() => isAllSelector ? selectable.isAllSelected.value : selectable.isSelected(data)),
        );
    })).pipe(
        switchMap(o => o),
    ), {initialValue: false});

    private readonly isCheckedMergedData = computed(() => ({
        ...this.isSelecteds(),
        ...this.inputs(),
        isSelected: this.isSelected(),
    }));

    readonly isDisabled = toSignal(toObservable(this.selectable).pipe(
        switchMap(s => s.connect()),
        map(v => v.length === 0),
    ));

    readonly isChecked = computed(() => {
        const {
            radio,
            isAllSelector,
            isNoneSelected,
            indeterminate,
            isSelected,
            isAllSelected,
        } = this.isCheckedMergedData();

        if (radio && isAllSelector) {
            return isNoneSelected;
        } else if (isNoneSelected) {
            return false;
        } else if (radio || !indeterminate) {
            return isSelected;
        }
        return isAllSelected;
    });

    readonly isIndeterminate = computed(() => {
        const {indeterminate, isIndeterminateSelected: isIndeterminate} = this.isCheckedMergedData();
        return indeterminate && isIndeterminate;
    });

    @HostListener('click', ['$event'])
    onClick(event: MouseEvent) {
        event.stopPropagation();
        this.toggle(this.data());
    }

    toggle(d?: T) {
        if (this.radio()) {
            this.selectable().clearSelection();
            if (d !== undefined) {
                this.selectable().toggleSelection(d)
            }
        } else {
            this.selectable().toggleSelection(d);
        }
    }
}
