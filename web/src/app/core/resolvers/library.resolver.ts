import {Resolvable} from '../util/resolvable';
import {gatherRouteSnapshotData} from '../util/route-data';
import {convertToParamMap} from '@angular/router';
import {ApiLibraryService, LibraryParams} from '../services/api/api-library.service';
import {inject} from '@angular/core';
import {of} from 'rxjs';

export const libraryResolver = Resolvable((route) => {
    const params = convertToParamMap(route.queryParams);
    const data = gatherRouteSnapshotData(route);
    const isAlbum = !!data[IS_ALBUM_LIBRARY];

    const libraryParam = params.get(LibraryParams.Library);
    let library = '';
    if (libraryParam) {
        library = `library_name:${libraryParam}`;
    }

    const query = `${params.get(LibraryParams.Query) ?? ''}${library}`;

    const includeKeys = new Set<string>([
        ...params.getAll(LibraryParams.IncludeKeys) ?? [],
        ...(data[LibraryParams.IncludeKeys] ?? []),
    ]);
    includeKeys.add('id');

    return of(inject(ApiLibraryService).query(query, isAlbum, false, [...includeKeys]));
});

export const IS_ALBUM_LIBRARY = 'isAlbum';
