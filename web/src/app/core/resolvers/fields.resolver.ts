import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {map} from 'rxjs';
import {gatherRouteSnapshotData} from '../util/route-data';
import {ApiLibraryService} from '../services/api/api-library.service';
import {IS_ALBUM_LIBRARY} from './library.resolver';

export const fieldsResolver = Resolvable(route => {
    const isAlbum = !!gatherRouteSnapshotData(route)[IS_ALBUM_LIBRARY];

    return inject(ApiLibraryService).fields().pipe(
        map(v => {
            if (isAlbum) {
                return [...(v.album.fields ?? []), ...(v.album.flexibleAttribute ?? [])];
            } else {
                return [...(v.item.fields ?? []), ...(v.item.flexibleAttribute ?? [])];
            }
        }),
        map(v => v.sort((a, b) => a.localeCompare(b))),
    );
});
