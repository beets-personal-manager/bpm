import {Component, computed, inject} from '@angular/core';
import {AsyncPipe, DatePipe, NgTemplateOutlet} from '@angular/common';
import {DataTableComponent} from '../../core/components/data-table/data-table.component';
import {MatCell, MatCellDef, MatColumnDef, MatHeaderCell, MatTableModule} from '@angular/material/table';
import {MatSort, MatSortHeader, MatSortModule} from '@angular/material/sort';
import {PrettyBytesPipe} from '../../core/pipes/pretty-bytes.pipe';
import {ToolbarSenderDirective} from '../../core/directives/toolbar/toolbar-sender.directive';
import {NavService} from '../../core/services/nav.service';
import {toSignal} from '@angular/core/rxjs-interop';
import {fileSeparatorResolver} from '../../core/resolvers/file-separator.resolver';
import {pathResolver} from '../../core/resolvers/path.resolver';
import {Router} from '@angular/router';
import {DataTableDataSource} from '../../core/components/data-table/data-table-datasource';
import {BrowseListing} from '../../core/services/browse.service';
import {FilesDatasource} from './files.datasource';
import {TypeChipsComponent} from '../../core/components/type-chips.component';
import {DeleteConfirmComponent, Deleter} from '../../core/components/delete-confirm/delete-confirm.component';
import {ApiLogsService, LogListing} from '../../core/services/api/api-logs.service';
import {Observable} from 'rxjs';
import {ApiBrowseService} from '../../core/services/api/api-browse.service';
import {FilesToolbarImportComponent} from './files-toolbar/files-toolbar-import/files-toolbar-import.component';
import {librariesResolver} from '../../core/resolvers/libraries.resolver';
import {queriesResolver} from '../../core/resolvers/queries.resolver';

@Component({
    selector: 'app-files',
    imports: [
        DataTableComponent,
        ToolbarSenderDirective,
        MatTableModule,
        MatSortModule,
        AsyncPipe,
        TypeChipsComponent,
        NgTemplateOutlet,
        PrettyBytesPipe,
        DeleteConfirmComponent,
        FilesToolbarImportComponent,
    ],
    templateUrl: './files.component.html',
    styleUrl: './files.component.scss',
    standalone: true,
})
export class FilesComponent {
    readonly dataSource = new FilesDatasource();
    readonly dataSourceSelected = new DataTableDataSource(true, this.dataSource.selectedData$);

    private readonly navService = inject(NavService);
    readonly fileSeparator = toSignal(fileSeparatorResolver.resolve(this.navService.routeData()), {initialValue: '/'});

    readonly currentPath = toSignal(pathResolver.resolve(this.navService.routeData()), {initialValue: []});
    readonly path = computed(() => this.currentPath().join(this.fileSeparator()));

    readonly libraries = toSignal(librariesResolver.resolve(this.navService.routeData()), {initialValue: ['Tracks']});
    readonly queries = toSignal(queriesResolver.resolve(this.navService.routeData()), {initialValue: []});

    private readonly router = inject(Router);
    private readonly filesLink = this.navService.navRootGroup.navFiles.link;

    readonly fileDeleter = new class implements Deleter<BrowseListing>{
        private readonly browseService = inject(ApiBrowseService);

        constructor(
            private readonly filesComponent: FilesComponent,
        ) {
        }

        name(l: BrowseListing): string {
            return l.name;
        }

        delete(l: BrowseListing): Observable<void> {
            return this.browseService.rm([...this.filesComponent.currentPath(), l.name].join('/'));
        }
    }(this);

    navigateTo(row: BrowseListing) {
        if (row.isDir) {
            this.router.navigate([this.filesLink, ...this.currentPath(), encodeURI(row.name)]);
        }
    }
}
