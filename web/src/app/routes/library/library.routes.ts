import {Route} from "@angular/router";
import {LibraryDetailsComponent} from './library-details/library-details.component';
import {fieldsResolver} from '../../core/resolvers/fields.resolver';
import {librariesResolver} from '../../core/resolvers/libraries.resolver';
import {IS_ALBUM_LIBRARY, libraryResolver} from '../../core/resolvers/library.resolver';
import {LibraryParams} from '../../core/services/api/api-library.service';
import {
    LibraryAlbumsOverviewComponent
} from './library-albums-overview/library-albums-overview.component';
import {TAB_NAV_RESOLVER, TabViewComponent} from '../../core/components/tab-view/tab-view.component';
import {navLibraryGroupResolver} from '../../core/resolvers/nav-library-group.resolver';
import {navLibraryAlbumGroupResolver} from '../../core/resolvers/nav-library-album-group.resolver';

export const libraryRoutes: Route[] = [
    {
        path: 'library',
        component: TabViewComponent,
        runGuardsAndResolvers: 'always',
        resolve: {
            ...libraryResolver,
            ...librariesResolver,
            ...navLibraryGroupResolver,
        },
        data: {
            [TAB_NAV_RESOLVER]: navLibraryGroupResolver,
        },
        children: [
            {
                path: 'tracks',
                runGuardsAndResolvers: 'always',
                resolve: {
                    ...fieldsResolver,
                },
                component: LibraryDetailsComponent,
            },
            {
                path: 'albums',
                runGuardsAndResolvers: 'always',
                component: TabViewComponent,
                data: {
                    [IS_ALBUM_LIBRARY]: true,
                    [TAB_NAV_RESOLVER]: navLibraryAlbumGroupResolver,
                },
                resolve: {
                    ...navLibraryAlbumGroupResolver,
                },
                children: [
                    {
                        path: 'overview',
                        runGuardsAndResolvers: 'always',
                        component: LibraryAlbumsOverviewComponent,
                        data: {
                            [LibraryParams.IncludeKeys]: [
                                'year',
                                'albumartist',
                                'album',
                                'genre',
                                'albumtotal',
                                'disctotal',
                            ],
                        },
                    },
                    {
                        path: 'details',
                        runGuardsAndResolvers: 'always',
                        component: LibraryDetailsComponent,
                        resolve: {
                            ...fieldsResolver,
                        },
                    },
                    {
                        path: '',
                        runGuardsAndResolvers: 'always',
                        redirectTo: 'overview',
                        pathMatch: 'full',
                    }
                ],
            },
            {
                path: '',
                runGuardsAndResolvers: 'always',
                redirectTo: 'albums',
                pathMatch: 'full',
            }
        ],
    }
];
