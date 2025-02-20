import {Component, computed, ElementRef, inject, model, signal, TemplateRef, viewChild} from '@angular/core';
import {MatButtonModule} from '@angular/material/button';
import {
    MAT_DIALOG_DATA,
    MatDialogModule,
    MatDialogRef,
} from '@angular/material/dialog';
import {CommonModule} from '@angular/common';
import {BrowseListing} from '../../../../../core/services/browse.service';
import {StartImport} from '../../../../../core/services/api/api-queue.service';
import {SelectionModel} from '@angular/cdk/collections';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {map} from 'rxjs';
import {MatCardModule} from '@angular/material/card';
import {MatFormFieldModule} from '@angular/material/form-field';
import {MatInputModule} from '@angular/material/input';
import {MatAutocomplete, MatAutocompleteModule, MatAutocompleteTrigger} from '@angular/material/autocomplete';
import {MatListModule} from '@angular/material/list';
import {FormControl, FormsModule, ReactiveFormsModule} from '@angular/forms';
import {MatIconModule} from '@angular/material/icon';
import {DropdownComponent} from '../../../../../core/components/dropdown.component';

const SOUNDTRACK_QUERY = 'Soundtracks';

@Component({
    selector: 'app-files-toolbar-import-dialog',
    imports: [
        MatDialogModule,
        MatButtonModule,
        MatCardModule,
        CommonModule,
        MatListModule,
        MatAutocompleteModule,
        MatFormFieldModule,
        FormsModule,
        MatInputModule,
        MatIconModule,
        ReactiveFormsModule,
        DropdownComponent,
    ],
    templateUrl: './files-toolbar-import-dialog.component.html',
    styleUrls: [
        './files-toolbar-import-dialog.component.scss',
        '../files-toolbar-import.component.scss',
    ],
    standalone: true,
})
export class FilesToolbarImportDialogComponent {
    private readonly dialogRef = inject(MatDialogRef<FilesToolbarImportDialogComponent>);

    readonly libraries = signal<string[]>([]);
    readonly queries!: string[];
    readonly path = signal<string[]>([]);
    readonly importFile!: BrowseListing;
    readonly isDir = signal(false);

    readonly library = signal('Tracks');
    // readonly customLibrary = computed(() => !this.libraries().includes(this.library()));

    private readonly $selectedQueries = new SelectionModel<string>(true, []);
    readonly selectedQueries = toSignal(this.$selectedQueries.changed.pipe(
        map(() => this.$selectedQueries.selected),
    ), {initialValue: []});

    readonly flat = signal(false);
    readonly groupAlbums = signal(false);
    readonly singleton = signal(false);
    readonly timid = signal(false);
    readonly asIs = signal(false);

    readonly importRequest = computed<StartImport>(() => ({
        path: this.path(),
        library: this.library(),
        queries: this.selectedQueries(),
        set: {},
        groupAlbums: this.groupAlbums(),
        flat: this.flat(),
        singleton: this.singleton(),
        timid: this.timid(),
        asIs: this.asIs(),
    }));

    readonly cantImport = computed(() => [
        this.library() === '',
    ].some(v => v));

    constructor() {
        const data = inject<FilesToolbarImportDialogData>(MAT_DIALOG_DATA);
        this.path.set(data.path);
        this.libraries.set(data.libraries);
        this.queries = data.queries;
        this.importFile = data.importFile;
        this.isDir.set(data.importFile.isDir);

        if (data.importFile.isDir) {
            this.groupAlbums.set(true);
        } else {
            this.singleton.set(true);
        }

        if (data.queries.includes(SOUNDTRACK_QUERY)) {
            this.$selectedQueries.select(SOUNDTRACK_QUERY);
        }
    }

    querySelected(value: string): boolean {
        return this.$selectedQueries.isSelected(value);
    }

    selectQuery(value: string, selected: boolean) {
        (selected ? this.$selectedQueries.select : this.$selectedQueries.deselect).bind(this.$selectedQueries)(value);
    }

    onNoClick(): void {
        this.dialogRef.close();
    }
}

export type FilesToolbarImportDialogData = {
    libraries: string[];
    queries: string[];
    path: string[];
    importFile: BrowseListing;
};
