import {Routes} from '@angular/router';
import {FilesComponent} from './files.component';
import {fileSeparatorResolver} from '../../core/resolvers/file-separator.resolver';
import {pathResolver} from '../../core/resolvers/path.resolver';
import {browseFilesResolver} from '../../core/resolvers/browse-files.resolver';
import {librariesResolver} from '../../core/resolvers/libraries.resolver';
import {queriesResolver} from '../../core/resolvers/queries.resolver';

export const filesRoutes: Routes = [
    {
        path: 'files',
        children: [
            {
                path: '**',
                runGuardsAndResolvers: "always",
                resolve: {
                    ...pathResolver,
                    ...browseFilesResolver,
                    ...fileSeparatorResolver,
                    ...queriesResolver,
                    ...librariesResolver,
                },
                component: FilesComponent,
            },
        ],
    }
];

