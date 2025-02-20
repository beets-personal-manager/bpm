import {DestroyRef, Injectable, NgZone} from '@angular/core';
import {HttpClient, HttpDownloadProgressEvent, HttpEventType, HttpResponse} from '@angular/common/http';
import {filter, map, Observable, scan, shareReplay, Subscriber} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiLibraryService {
    constructor(
        private readonly httpClient: HttpClient,
        private readonly zone: NgZone,
        private readonly destroyRef: DestroyRef,
    ) { }

    query(query: string, albums: boolean, fromTags: boolean, includeKeys: string[]): Observable<LibraryListing[]> {
        return new Observable((subscriber: Subscriber<string>) => {
            let start = 0;
            let text = '';
            const getIdx = () => text.indexOf('\n', start);
            const readLines = () => {
                for (let idx = getIdx(); start < text.length && idx >= 0; idx = getIdx()) {
                    const line = text.slice(start, idx).trim();
                    start = idx + 1;
                    subscriber.next(line);
                }
            };

            subscriber.add(this.httpClient.get(getQueryURL(query, albums, fromTags, includeKeys), {
                observe: 'events',
                responseType: 'text',
                reportProgress: true,
            }).pipe(
                filter(e => e.type === HttpEventType.DownloadProgress || e.type === HttpEventType.Response),
                map(e => {
                    if (e.type === HttpEventType.DownloadProgress) {
                        return (e as HttpDownloadProgressEvent).partialText;
                    }
                    return (e as HttpResponse<any>).body;
                }),
            ).subscribe({
                next: txt => {
                    text = txt;
                    readLines();
                },
                complete: () => {
                    readLines();
                    subscriber.complete();
                },
                error: err => subscriber.error(err),
            }))
        }).pipe(
            map(raw => {
                let ok = false;
                try {
                    const v = JSON.parse(raw) as LibraryListing;
                    ok = true;
                    return v;
                } finally {
                    if (!ok) {
                        console.error(raw);
                    }
                }
            }),
            scan((acc, v) => [...acc, v], Array<LibraryListing>()),
            shareReplay({
                bufferSize: 1,
                refCount: true,
            }),
        );
    }

    fields(): Observable<Fields> {
        return this.httpClient.get<Fields>('/api/library/fields').pipe(
            shareReplay(1),
        );
    }

    libraries(albumsOnly: boolean): Observable<string[]> {
        const params = new URLSearchParams();
        if (albumsOnly) {
            params.set(LibraryParams.Album, 'true');
        }
        return this.httpClient.get<string[]>(`/api/library/libraries?${params.toString()}`).pipe(
            shareReplay(1),
        );
    }
}

function getQueryURL(query: string, albums: boolean, fromTags: boolean, includeKeys: string[]): string {
    const params = new URLSearchParams();
    if (albums) {
        params.set(LibraryParams.Album, 'true');
    }
    if (fromTags) {
        params.set(LibraryParams.FromFileTags, 'true');
    }
    if (includeKeys.length > 0) {
        params.set(LibraryParams.IncludeKeys, includeKeys.join(','));
    }
    if (query !== '') {
        params.set(LibraryParams.Query, query);
    }
    return `/api/library?${params.toString()}`;
}

export type LibraryListing = {
    [KEY: string]: any;
};

export type Fields = {
    item: FieldSet;
    album: FieldSet;
};

export type FieldSet = {
    fields: string[];
    flexibleAttribute: string[];
};

export enum LibraryParams {
    Album = 'a',
    FromFileTags = 'fft',
    IncludeKeys = 'ik',
    Query = 'q',
    Library = 'l',
}
