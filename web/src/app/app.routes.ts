import { Routes } from '@angular/router';
import {StatsComponent} from './routes/stats/stats.component';
import {libraryRoutes} from './routes/library/library.routes';
import {logsRoutes} from './routes/logs/logs.routes';
import {filesRoutes} from './routes/files/files.route';
import {consoleRoutes} from './routes/console/console.routes';

export const routes: Routes = [
    {
        path: '',
        component: StatsComponent,
    },
    ...filesRoutes,
    ...consoleRoutes,
    ...logsRoutes,
    ...libraryRoutes,
];
