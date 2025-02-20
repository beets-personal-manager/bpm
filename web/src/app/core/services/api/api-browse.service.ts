import {Injectable} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Observable, shareReplay, take} from 'rxjs';
import {HttpClient} from '@angular/common/http';

@Injectable({
    providedIn: 'root'
})
export class ApiBrowseService {
    private readonly $fileSeparator!: Observable<string>;

    constructor(
        private readonly httpClient: HttpClient,
    ) {
        this.$fileSeparator = this.httpClient.get<string>('/api/browse/fileseparator').pipe(
            takeUntilDestroyed(),
            take(1),
            shareReplay(1),
        );
    }

    get fileSeparator(): Observable<string> {
        return this.$fileSeparator;
    }

    ls(dirPath: string): Observable<Array<FileListing>> {
        return this.httpClient.get<Array<FileListing>>(`/api/browse/files/${encodeURI(dirPath)}`).pipe(
            shareReplay(1),
        );
    }

    rm(filePath: string): Observable<void> {
        return this.httpClient.delete<void>(`/api/browse/files/${encodeURI(filePath)}`).pipe(
            shareReplay(1),
        );
    }
}

export type FileListing = {
    name: string;
    isDir: boolean;
    path: string;
    size: string;
}
