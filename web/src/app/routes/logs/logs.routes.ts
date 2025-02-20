import {Route} from "@angular/router";
import {LogsComponent} from './logs.component';
import {logsResolver} from '../../core/resolvers/logs.resolver';

export const logsRoutes: Route[] = [
    {
        path: 'logs',
        component: LogsComponent,
        runGuardsAndResolvers: 'always',
        resolve: {
            ...logsResolver,
        },
    }
];
