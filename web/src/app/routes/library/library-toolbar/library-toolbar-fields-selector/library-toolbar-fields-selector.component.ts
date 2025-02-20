import {Component, input} from '@angular/core';
import {
    LibraryToolbarFilterButtonComponent
} from '../library-toolbar-filter-button/library-toolbar-filter-button.component';
import {LibraryParams} from '../../../../core/services/api/api-library.service';
import {LibraryToolbarFieldsSelectorDatasource} from './library-toolbar-fields-selector.datasource';

@Component({
    selector: 'app-library-toolbar-fields-selector',
    imports: [
        LibraryToolbarFilterButtonComponent,
    ],
    styles: [],
    standalone: true,
    template: `
    <app-library-toolbar-filter-button
        tooltip="Columns"
        [urlParam]="urlParam"
        [multiple]="true"
        [clearable]="true"
        [dataSource]="dataSource()"
        clearableText="All"
        icon="view_column">
    </app-library-toolbar-filter-button>
`,
})
export class LibraryToolbarFieldsSelectorComponent {
    readonly urlParam = LibraryParams.IncludeKeys;
    readonly dataSource = input.required<LibraryToolbarFieldsSelectorDatasource>();
}
