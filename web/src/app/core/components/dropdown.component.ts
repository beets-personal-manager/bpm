import {
    ChangeDetectorRef,
    Component,
    computed,
    contentChildren,
    ElementRef,
    input,
    model, signal,
    viewChild,
    viewChildren
} from '@angular/core';
import {TapsDirective} from '../directives/taps.directive';
import {MatButtonModule} from '@angular/material/button';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatRadioModule} from '@angular/material/radio';
import {
    MatAutocomplete, MatAutocompleteActivatedEvent,
    MatAutocompleteModule, MatAutocompleteSelectedEvent,
    MatAutocompleteTrigger,
    MatOption
} from '@angular/material/autocomplete';
import {
    AbstractControl,
    FormControl,
    FormGroupDirective,
    FormsModule,
    NgForm,
    ReactiveFormsModule, Validators
} from '@angular/forms';
import {MatFormField, MatFormFieldModule, MatLabel, MatSuffix} from '@angular/material/form-field';
import {MatIcon, MatIconModule} from '@angular/material/icon';
import {MatInput, MatInputModule} from '@angular/material/input';
import {MatDialogModule} from '@angular/material/dialog';
import {MatCardModule} from '@angular/material/card';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {combineLatest, distinctUntilChanged, filter, map, of, startWith, switchMap, take, tap} from 'rxjs';
import {ErrorStateMatcher} from '@angular/material/core';
import {newUUID} from '../util/uuid';

@Component({
    selector: 'app-dropdown',
    imports: [
        CommonModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatIconModule,
        ReactiveFormsModule,
    ],
    styles: [
        `
            .dropdown {
                width: 100%;
            }
        `,
    ],
    standalone: true,
    template: `
        <mat-form-field (click)="onClick()" class="dropdown">
            <mat-label>{{ label() }}</mat-label>
            <input
                matInput
                type="text"
                [errorStateMatcher]="errMatcher"
                [matAutocomplete]="autocomplete"
                [formControl]="control"
                #trigger="matAutocompleteTrigger"
                #rawInput>
            <mat-icon matSuffix>arrow_drop_down</mat-icon>
        </mat-form-field>

        @if (control.hasError('required')) {
            <mat-error>Library is required</mat-error>
        }

        <mat-autocomplete (closed)="onClose()" [autoSelectActiveOption]="true" #autocomplete="matAutocomplete">
            @for (opt of rawOptions(); track opt.value) {
                <mat-option [value]="opt.value" [disabled]="opt.disabled" [id]="opt.id">{{ opt.value }}</mat-option>
            }
        </mat-autocomplete>
    `,
})
export class DropdownComponent<T> {
    readonly label = input('');
    readonly selected = model<T>();

    readonly control = new FormControl<T>(this.selected()!, [Validators.required]);
    private readonly rawInput = viewChild.required<ElementRef>('rawInput');
    private readonly trigger = viewChild.required<MatAutocompleteTrigger>('trigger');

    private readonly providedOptions = contentChildren(MatOption<T>);
    private readonly providedOptionValues = computed(() => this.providedOptions().map(o => o.value));
    readonly custom = computed(() => {
        const selected = this.selected();
        const values = this.providedOptionValues();
        return selected != undefined && selected != '' && !values.includes(selected);
    });

    readonly rawOptions = computed(() => {
        const opts: OptionInput<T>[] = this.providedOptions().map(opt => ({
            disabled: opt.disabled,
            id: opt.id,
            value: opt.value
        }));

        const custom = this.custom();
        if (custom) {
            opts.unshift({
                disabled: false,
                id: newUUID(),
                value: this.selected()!,
            });
        }
        return opts;
    });

    readonly errMatcher = new ErrMatcher();

    readonly firstOpen = signal(true);

    constructor() {
        combineLatest({
            v: this.control.valueChanges.pipe(
                startWith(this.selected()),
            ),
            def: toObservable(this.selected),
        }).pipe(
            takeUntilDestroyed(),
            map(({v, def}) => v ?? def),
            filter(v => v !== undefined),
            distinctUntilChanged(),
        ).subscribe((v: T) => {
            this.selected.set(v);
            this.control.setValue(v);
        });
    }

    onClose() {
        this.firstOpen.set(true);
        this.rawInput().nativeElement.blur();
    }

    onClick() {
        if (this.firstOpen()) {
            this.firstOpen.set(false);
        } else {
            this.trigger().closePanel();
        }
    }
}

class ErrMatcher implements ErrorStateMatcher {
    isErrorState(control: AbstractControl | null, form: FormGroupDirective|NgForm|null): boolean {
        const isSubmitted = form && form.submitted;
        return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
    }
}

type OptionInput<T> = {
    disabled: boolean;
    id: string;
    value: T;
};
