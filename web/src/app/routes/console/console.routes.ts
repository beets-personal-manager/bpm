import {Route} from "@angular/router";
import {TAB_NAV_RESOLVER, TabViewComponent} from '../../core/components/tab-view/tab-view.component';
import {navConsoleGroupResolver} from '../../core/resolvers/nav-console-group.resolver';
import {ConsoleQueueComponent} from './console-queue/console-queue.component';
import {ConsoleTerminalComponent} from './console-terminal/console-terminal.component';
import {ConsoleEditorComponent} from './console-editor/console-editor.component';
import {editorGuard} from '../../core/guards/editor.guard';

export const consoleRoutes: Route[] = [
    {
        path: 'console',
        component: TabViewComponent,
        runGuardsAndResolvers: 'always',
        resolve: {
            ...navConsoleGroupResolver,
        },
        data: {
            [TAB_NAV_RESOLVER]: navConsoleGroupResolver,
        },
        children: [
            {
                path: 'queue',
                component: ConsoleQueueComponent,
                runGuardsAndResolvers: 'always',
            },
            {
                path: 'editor',
                component: ConsoleEditorComponent,
                runGuardsAndResolvers: 'always',
                canActivate: [
                    editorGuard,
                ],
            },
            ...['console', 'stdout', 'stderr'].map(path => ({
                path,
                component: ConsoleTerminalComponent,
                runGuardsAndResolvers: 'always',
            } as Route)),
            {
                path: '',
                redirectTo: 'console',
                pathMatch: 'full',
            }
        ],
    }
];
