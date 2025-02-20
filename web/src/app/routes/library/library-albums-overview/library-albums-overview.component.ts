import {
    Component,
    inject
} from '@angular/core';
import {ToolbarSenderDirective} from '../../../core/directives/toolbar/toolbar-sender.directive';
import {MatIconModule} from '@angular/material/icon';
import {AsyncPipe} from '@angular/common';
import {MatCardModule} from '@angular/material/card';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {AlbumArtUrlPipe} from '../../../core/pipes/album-art-url.pipe';
import {map, switchMap} from 'rxjs';
import {NavService} from '../../../core/services/nav.service';
import {libraryResolver} from '../../../core/resolvers/library.resolver';
import {
    LibraryToolbarLibrarySelectorComponent
} from '../library-toolbar/library-toolbar-library-selector/library-toolbar-library-selector.component';
import {
    LibraryToolbarLibrarySelectorDatasource
} from '../library-toolbar/library-toolbar-library-selector/library-toolbar-library-selector.datasource';
import {SquareSizeDirective} from '../../../core/directives/square-size.directive';

@Component({
  selector: 'app-library-albums-overview',
    imports: [
        ToolbarSenderDirective,
        AlbumArtUrlPipe,
        LibraryToolbarLibrarySelectorComponent,
        MatIconModule,
        MatCardModule,
        AsyncPipe,
        SquareSizeDirective,
    ],
  templateUrl: './library-albums-overview.component.html',
  styleUrl: './library-albums-overview.component.scss'
})
export class LibraryAlbumsOverviewComponent{
    readonly data = toSignal(libraryResolver.resolve(inject(NavService).routeData()).pipe(
        takeUntilDestroyed(),
        switchMap(o => o),
        map(data => data.map(data => ({
            id: data['id'],
            title: data['album'],
            artist: data['albumartist'],
        } as Data))),
    ), {initialValue: []});

    readonly libraries = new LibraryToolbarLibrarySelectorDatasource();
    readonly hasError = new Set<number>();
    readonly notLoaded = new Set<number>();

    constructor() {
        toObservable(this.data).pipe(
            takeUntilDestroyed(),
        ).subscribe((data) => {
            this.hasError.clear();
            this.notLoaded.clear();
            data.forEach(data => this.notLoaded.add(data.id));
        });
    }

    imageError(d: Data) {
        this.hasError.add(d.id);
        this.imageLoaded(d)
    }

    imageLoaded(d: Data) {
        this.notLoaded.delete(d.id);
    }

    hasImage(d: Data): boolean {
        return !this.notLoaded.has(d.id) && !this.hasError.has(d.id);
    }
}

type Data = {
    id: number;
    title: string;
    artist: string;
};
