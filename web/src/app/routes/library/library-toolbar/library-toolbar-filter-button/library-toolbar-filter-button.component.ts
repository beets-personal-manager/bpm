import {Component, computed, inject, input} from '@angular/core';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {EMPTY, filter, finalize, map, merge, switchMap} from 'rxjs';
import {ActivatedRoute, Router} from '@angular/router';
import {NavService} from '../../../../core/services/nav.service';
import {DataSource} from '@angular/cdk/collections';
import {DataTableDataSource} from '../../../../core/components/data-table/data-table-datasource';
import {LibraryParams} from '../../../../core/services/api/api-library.service';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {MatMenuModule} from '@angular/material/menu';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {TapsDirective} from '../../../../core/directives/taps.directive';
import {MatRadioModule} from '@angular/material/radio';
import {AsyncPipe, CommonModule} from '@angular/common';
import {SelectButtonComponent} from '../../../../core/components/select-button.component';
import {unorderedEquals} from '../../../../core/util/unordered-equals';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
    selector: 'app-library-toolbar-filter-button',
    imports: [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatCheckboxModule,
        MatRadioModule,
        CommonModule,
        SelectButtonComponent,
        MatTooltipModule,
    ],
    templateUrl: './library-toolbar-filter-button.component.html',
    styleUrl: './library-toolbar-filter-button.component.scss',
    standalone: true,
})
export class LibraryToolbarFilterButtonComponent {
    private readonly router = inject(Router);
    private readonly navService = inject(NavService);
    private readonly activatedRoute = inject(ActivatedRoute);

    readonly tooltip = input('');
    readonly urlParam = input.required<LibraryParams>();
    readonly icon = input.required<string>();
    readonly multiple = input.required<boolean>();
    readonly clearable = input.required<boolean>();
    readonly clearableText = input.required<string>();
    readonly dataSource = input.required<DataTableDataSource<string>>();

    private readonly link = toSignal(merge(
        this.navService.navRootGroup.navLibrary.navLibraryTracks.isActive$.pipe(
            filter(v => v),
            map(() => this.navService.navRootGroup.navLibrary.navLibraryTracks.link),
        ),
        this.navService.navRootGroup.navLibrary.navLibraryAlbums.navLibraryAlbumsDetails.isActive$.pipe(
            filter(v => v),
            map(() => this.navService.navRootGroup.navLibrary.navLibraryAlbums.navLibraryAlbumsDetails.link),
        ),
        this.navService.navRootGroup.navLibrary.navLibraryAlbums.navLibraryAlbumsOverview.isActive$.pipe(
            filter(v => v),
            map(() => this.navService.navRootGroup.navLibrary.navLibraryAlbums.navLibraryAlbumsOverview.link),
        ),
    ).pipe(
        takeUntilDestroyed(),
        filter(v => !!v),
    ), {initialValue: this.navService.navRootGroup.navLibrary.navLibraryTracks.link});

    async onMenuClose() {
        const params = {...this.activatedRoute.snapshot.queryParams};
        const param = this.urlParam();
        const values = this.dataSource().selectedData;
        let b: string[] = [];
        if (param in params) {
            b = [params[param]];
        }
        if (unorderedEquals(values, b)) {
            return;
        } else if (values.length === 0) {
            delete params[param];
        } else {
            params[param] = values;
        }

        return this.router.navigate([this.link()], {
            queryParams: params,
            queryParamsHandling: 'replace',
        });
    }
}

