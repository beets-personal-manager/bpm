import {Component, input} from '@angular/core';
import {
    LibraryToolbarFilterButtonComponent
} from '../library-toolbar-filter-button/library-toolbar-filter-button.component';
import {LibraryParams} from '../../../../core/services/api/api-library.service';
import {LibraryToolbarLibrarySelectorDatasource} from './library-toolbar-library-selector.datasource';

@Component({
  selector: 'app-library-toolbar-library-selector',
    imports: [
        LibraryToolbarFilterButtonComponent,
    ],
    styles: [],
    standalone: true,
    template: `
    <app-library-toolbar-filter-button
        tooltip="Library"
        [urlParam]="urlParam"
        [multiple]="false"
        [clearable]="true"
        [dataSource]="dataSource()"
        clearableText="All"
        icon="library_music">
    </app-library-toolbar-filter-button>
`,
})
export class LibraryToolbarLibrarySelectorComponent {
    readonly urlParam = LibraryParams.Library;
    readonly dataSource = input.required<LibraryToolbarLibrarySelectorDatasource>();
}
