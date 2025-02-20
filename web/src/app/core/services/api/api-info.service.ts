import {inject, Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {forkJoin, Observable, shareReplay} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiInfoService {
    readonly imports = new ApiImportStats(inject(HttpClient)).stats;
    readonly tracks = new ApiTracksStats(inject(HttpClient)).stats;
    readonly beets = new ApiBeetsStats(inject(HttpClient)).stats;

    all(): Observable<AllStats> {
        return forkJoin({
            library: this.tracks(),
            imports: this.imports(),
            beets: this.beets(),
        });
    }
}

export type AllStats = {
    library: FileStats;
    imports: FileStats;
    beets: BeetsStats;
};

interface Stats<T, R> {
    stats(options?: T): Observable<R>;
}

abstract class ApiStats<T, R> implements Stats<T, R> {
    protected abstract name: string;

    constructor(
        private readonly httpClient: HttpClient,
    ) { }

    readonly stats = (options?: T): Observable<R> => {
        return this.httpClient.get<R>(
            this.url(`/api/info/${this.name}`, options),
            this.options(options),
        ).pipe(
            shareReplay(1),
        );
    }

    protected abstract url(url: string, options?: T): string;
    protected abstract options(options?: T): {};
}

class ApiTracksStats extends ApiStats<{}, FileStats> {
    protected name = 'tracks';

    protected override url(url: string): string {
        return url;
    }

    protected override options(): {} {
        return {};
    }
}

class ApiImportStats extends ApiStats<string, FileStats> {
    protected name = 'imports';

    protected override url(url: string, dirPath?: string): string {
        if (dirPath) {
            return `${url}/${encodeURI(dirPath)}`;
        }
        return `${url}/`;
    }

    protected override options(): {} {
        return {};
    }
}

class ApiBeetsStats extends ApiStats<string, BeetsStats> {
    protected name = 'beets';

    protected override url(url: string): string {
        return url;
    }

    protected override options(query?: string): {} {
        let params = new HttpParams();
        if (query) {
            params = params.append('query', query);
        }
        return {params};
    }
}

export type BeetsStats = {
    tracks: number;
    time: number;
    size: number;
    artists: number;
    albums: number;
    albumArtists: number;
};

export type FileStats = {
    folders: number;
    files: number;
    types: ExtensionTypes;
};

export type ExtensionTypes = {
    [Extension: string]: number;
};
