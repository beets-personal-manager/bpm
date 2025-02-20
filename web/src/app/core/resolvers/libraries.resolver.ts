import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {ApiLibraryService} from '../services/api/api-library.service';
import {gatherRouteSnapshotData} from '../util/route-data';
import {IS_ALBUM_LIBRARY} from './library.resolver';

export const librariesResolver = Resolvable(route => {
    const data = gatherRouteSnapshotData(route);
    const isAlbum = !!data[IS_ALBUM_LIBRARY];
    return inject(ApiLibraryService).libraries(isAlbum);
});
