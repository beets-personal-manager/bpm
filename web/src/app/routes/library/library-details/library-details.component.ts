import {Component} from '@angular/core';
import {toSignal} from '@angular/core/rxjs-interop';
import {EMPTY, finalize, map, Observable} from 'rxjs';
import {MatSortModule} from '@angular/material/sort';
import {ToolbarSenderDirective} from '../../../core/directives/toolbar/toolbar-sender.directive';
import {CommonModule} from '@angular/common';
import {MatTableModule} from '@angular/material/table';
import {DataTableComponent} from '../../../core/components/data-table/data-table.component';
import {LibraryDetailsDatasource} from './library-details.datasource';
import {
    LibraryToolbarFieldsSelectorDatasource
} from '../library-toolbar/library-toolbar-fields-selector/library-toolbar-fields-selector.datasource';
import {
    LibraryToolbarFieldsSelectorComponent
} from '../library-toolbar/library-toolbar-fields-selector/library-toolbar-fields-selector.component';
import {
    LibraryToolbarLibrarySelectorDatasource
} from '../library-toolbar/library-toolbar-library-selector/library-toolbar-library-selector.datasource';
import {
    LibraryToolbarLibrarySelectorComponent
} from '../library-toolbar/library-toolbar-library-selector/library-toolbar-library-selector.component';

@Component({
    selector: 'app-library-details',
    imports: [
        DataTableComponent,
        MatSortModule,
        MatTableModule,
        CommonModule,
        ToolbarSenderDirective,
        MatSortModule,
        LibraryToolbarFieldsSelectorComponent,
        LibraryToolbarLibrarySelectorComponent,
    ],
    templateUrl: './library-details.component.html',
    styleUrl: './library-details.component.scss',
    standalone: true,
})
export class LibraryDetailsComponent {
    readonly dataSource = new LibraryDetailsDatasource();
    readonly libraries = new LibraryToolbarLibrarySelectorDatasource();
    readonly fields = new LibraryToolbarFieldsSelectorDatasource();
    readonly columns = toSignal(this.fields.selectedData$, {initialValue: []});
}

