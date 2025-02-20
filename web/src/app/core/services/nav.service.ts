import {DestroyRef, inject, Injectable} from '@angular/core';
import {BehaviorSubject, combineLatest, EMPTY, filter, map, Observable, startWith, switchMap, tap} from 'rxjs';
import {ActivatedRoute, Data, EventType, NavigationEnd, Router, RouterEvent} from '@angular/router';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {LibraryParams} from './api/api-library.service';
import {gatherRouteData} from '../util/route-data';
import {EditorService} from './editor.service';

@Injectable({
  providedIn: 'root'
})
export class NavService {
    readonly navRootGroup = new class extends NavGroup {
        constructor(
            readonly navStats = new NavLink({
                name: 'Stats',
                link: '/',
            }),
            readonly navLibrary = new class extends NavLink {
                readonly navLibraryTracks = this.sublink({
                    name: 'Tracks',
                    link: 'tracks',
                    queryParams: {
                        [LibraryParams.IncludeKeys]: [
                            'album',
                            'albumartist',
                            'length',
                            'track',
                            'title',
                            'year',
                            'library_name',
                            'genre',
                        ],
                    },
                });
                readonly navLibraryAlbums = new class extends NavLink {
                    readonly navLibraryAlbumsOverview = this.sublink({
                        name: 'Overview',
                        link: 'overview',
                    });
                    readonly navLibraryAlbumsDetails = this.sublink({
                        name: 'Details',
                        queryParams: {
                            [LibraryParams.IncludeKeys]: [
                                'album',
                                'albumartist',
                                'genre',
                                'library_name',
                                'year',
                                'albumtotal',
                                'disctotal',
                            ],
                        },
                        link: 'details',
                    });

                    override readonly navGroup = new NavGroup([
                        this.navLibraryAlbumsOverview,
                        this.navLibraryAlbumsDetails,
                    ]);
                }({
                    name: 'Albums',
                    link: 'albums',
                    prefix: this,
                });

                override readonly navGroup: NavGroup = new NavGroup([
                    this.navLibraryTracks,
                    this.navLibraryAlbums,
                ]);
            }({
                name: 'Library',
                link: '/library',
            }),
            readonly navFiles = new NavLink({
                name: 'Files',
                link: '/files',
            }),
            readonly navConsole = new class extends NavLink {
                readonly navConsoleQueue = this.sublink({
                    name: 'Queue',
                    link: 'queue',
                });
                readonly navConsoleConsole = this.sublink({
                    name: 'Console',
                    link: 'console',
                });
                readonly navConsoleStdout = this.sublink({
                    name: 'Stdout',
                    link: 'stdout',
                });
                readonly navConsoleStderr = this.sublink({
                    name: 'Stderr',
                    link: 'stderr',
                });
                readonly navConsoleEditor = this.sublink({
                    name: 'Editor',
                    link: 'editor',
                });

                override readonly navGroup = new NavGroup([
                    this.navConsoleQueue,
                    this.navConsoleConsole,
                    this.navConsoleStdout,
                    this.navConsoleStderr,
                    this.navConsoleEditor,
                ]);
            }({
                name: 'Console',
                link: '/console',
            }),
            readonly navLogs = new NavLink({
                name: 'Logs',
                link: '/logs',
            }),
        ) {
            super([
                navStats,
                navLibrary,
                navFiles,
                navConsole,
                navLogs,
            ]);
        }
    }();

    constructor() {
        inject(EditorService).isEditor.pipe(
            takeUntilDestroyed(),
        ).subscribe(isEditor => this.navRootGroup.navConsole.navConsoleEditor.disabled = !isEditor);
    }

    private readonly router = inject(Router);

    routeData(activatedRoute = inject(ActivatedRoute)): Observable<Data> {
        return gatherRouteData(activatedRoute);
    }

    async reload() {
        return this.router.navigate([decodeURI(this.router.url)])
    }
}

function OnNav(router = inject(Router), destroyRef = inject(DestroyRef)) {
    return router.events.pipe(
        takeUntilDestroyed(destroyRef),
        filter(ev => ev.type === EventType.NavigationEnd),
        map(ev => ev as NavigationEnd),
    );
}

export class NavGroup {
    readonly isActive: Observable<boolean>;

    constructor(
        private readonly group: NavLink[],
    ) {
        this.isActive = combineLatest([...this.group].map(v => v.isActive$)).pipe(map(a => a.some(v => v)));
    }

    *[Symbol.iterator](): Iterator<NavLink> {
        for (const nav of this.group) {
            yield nav;
        }
    }
}

export class NavLink {
    private readonly router = inject(Router);
    private readonly $isActive = new BehaviorSubject(false);
    private readonly $isExact = new BehaviorSubject(false);
    readonly navGroup: NavGroup = new NavGroup([]);
    private readonly $disabled = new BehaviorSubject(false);

    public readonly name: string;
    private readonly $link: string;
    private readonly $queryParams?: {} = {};
    private readonly prefix?: NavLink;

    constructor(navLinkParams: NavLinkParams) {
        ({
            name: this.name,
            link: this.$link,
            queryParams: this.$queryParams,
            prefix: this.prefix,
        } = navLinkParams);

        OnNav().pipe(
            map(ev => ev.urlAfterRedirects),
            startWith(this.router.url),
        ).subscribe(ev => {
            if (this.link === '/') {
                this.$isActive.next(ev === '/');
            } else {
                this.$isActive.next(ev.startsWith(this.link));
            }
            this.$isExact.next((ev + '?').startsWith(this.link + '?'));
        })
    }

    get isActive$(): Observable<boolean> {
        return this.$isActive;
    }

    get isActive(): boolean {
        return this.$isActive.value;
    }

    get isExact$(): Observable<boolean> {
        return this.$isExact;
    }

    get isExact(): boolean {
        return this.$isExact.value;
    }

    get link(): string {
        if (this.prefix) {
            return `${this.prefix.link}/${this.$link}`;
        }
        return this.$link;
    }

    get queryParams(): {} {
        return this.$queryParams ?? {};
    }

    activate(): Promise<boolean> {
        return this.router.navigate([this.link]);
    }

    sublink(params: NavLinkParams): NavLink {
        return new NavLink({...params, prefix: params.prefix ?? this});
    }

    get disabled$(): Observable<boolean> {
        return this.$disabled;
    }

    get disabled(): boolean {
        return this.$disabled.value;
    }

    set disabled(disabled: boolean) {
        this.$disabled.next(disabled)
    }
}

export type NavLinkParams = {
    name: string;
    link: string;
    queryParams?: {};
    prefix?: NavLink;
};
