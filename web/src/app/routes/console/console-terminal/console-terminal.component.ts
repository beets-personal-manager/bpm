import {Component, computed, ElementRef, HostListener, inject, Signal, viewChild} from '@angular/core';
import {NgTerminalComponent, NgTerminalModule} from 'ng-terminal';
import {ConsoleTerminalInputComponent} from './console-terminal-input/console-terminal-input.component';
import {ToolbarSenderDirective} from '../../../core/directives/toolbar/toolbar-sender.directive';
import {MatIcon} from '@angular/material/icon';
import {MatIconButton} from '@angular/material/button';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {filter, map, merge, Observable, startWith} from 'rxjs';
import {TerminalDirective, TerminalKind, TerminalKinds} from './console-terminal.directive';
import {NavService} from '../../../core/services/nav.service';
import {ConsoleService} from '../../../core/services/console.service';
import {ApiConsoleService} from '../../../core/services/api/api-console.service';
import {MatTooltipModule} from '@angular/material/tooltip';

@Component({
    selector: 'app-console-terminal',
    imports: [
        NgTerminalModule,
        ConsoleTerminalInputComponent,
        ToolbarSenderDirective,
        MatIcon,
        MatIconButton,
        TerminalDirective,
        MatTooltipModule,
    ],
    templateUrl: './console-terminal.component.html',
    styleUrl: './console-terminal.component.scss',
    standalone: true,
})
export class ConsoleTerminalComponent {
    readonly output = viewChild<NgTerminalComponent>('output');
    private readonly $kind = toSignal<TerminalKind>(ActiveKind());
    readonly kind = computed(() => this.$kind() ?? TerminalKinds.console);
    private readonly consoleService = inject(ApiConsoleService);
    readonly isStopped = toSignal(inject(ConsoleService).isStopped, {initialValue: true});

    scrollToBottom() {
        this.output()?.underlying?.scrollToBottom();
    }

    stop() {
        this.consoleService.stop().subscribe();
    }
}

function ActiveKind(navService = inject(NavService)): Observable<TerminalKind> {
    return merge(
        navService.navRootGroup.navConsole.navConsoleConsole.isActive$.pipe(
            filter(v => v),
            map(() => TerminalKinds.console),
        ),
        navService.navRootGroup.navConsole.navConsoleStdout.isActive$.pipe(
            filter(v => v),
            map(() => TerminalKinds.stdout),
        ),
        navService.navRootGroup.navConsole.navConsoleStderr.isActive$.pipe(
            filter(v => v),
            map(() => TerminalKinds.stderr),
        ),
    );
}
