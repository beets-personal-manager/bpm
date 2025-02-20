import {DestroyRef, Injectable, signal, Signal} from "@angular/core";
import {ApiBrowseService, FileListing} from "./api/api-browse.service";
import {ApiInfoService, ExtensionTypes, FileStats} from "./api/api-info.service";
import {
    combineLatest,
    delay,
    EMPTY, endWith,
    first,
    forkJoin,
    map,
    Observable,
    of,
    shareReplay, startWith,
    switchMap,
    takeWhile,
} from "rxjs";

@Injectable({
    providedIn: 'root'
})
export class BrowseService {
    constructor(
        private readonly apiBrowseService: ApiBrowseService,
        private readonly apiInfoService: ApiInfoService,
    ) {  }

    loadFolder(dirPath: string): Observable<Listing> {
        return this.apiBrowseService.ls(dirPath).pipe(
            switchMap(files => combineLatest(files.map(file => {
                if (!file.isDir) {
                    return this.fileListing(file);
                }
                return this.folderListing(dirPath, file);
            }).map(o => o.pipe(
                startWith(undefined),
            )))),
            takeWhile(li => li.some(v => v === undefined), true),
            map(li => li.filter(e => e !== undefined)),
            shareReplay(1),
        );
    }

    private folderListing(dirPath: string, fi: FileListing): Observable<BrowseListing> {
        return this.apiInfoService.imports([dirPath, fi.name].map(v => v.trim()).filter(v => v).join('/')).pipe(
            map(v => ({...fi, ...v})),
        );
    }

    private fileListing(fi: FileListing): Observable<BrowseListing> {
        return of({
            ...fi,
            folders: undefined,
            files: undefined,
            types: undefined,
        });
    }
}

export type Listing = Array<BrowseListing>;


export type BrowseListing = FileListing & Partial<FileStats>;
