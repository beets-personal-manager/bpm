import {
    AfterViewInit,
    DestroyRef,
    Directive,
    ElementRef,
    Inject,
    inject,
    InjectionToken,
    Injector,
    input
} from '@angular/core';
import {ITerminalOptions} from "@xterm/xterm";
import {NgTerminalComponent} from 'ng-terminal';
import {
    ApiMessagesService,
    BaseMessage, ConsoleMessage,
    EventTypes,
    ExitMessage,
    MessageKinds, StartMessage,
    StdioKinds,
    StdioMessage
} from '../../../core/services/api/api-messages.service';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {filter, switchMap} from 'rxjs';
import {StartKind} from '../../../core/services/api/api-queue.service';

export const TERMINAL_OPTIONS = new InjectionToken<ITerminalOptions & {
    theme?: {
        border?: string;
    };
}>("TERMINAL_OPTIONS", {
    factory: () => ({
        fontFamily: '"Cascadia Code", Menlo, monospace',
        cursorBlink: true,
        convertEol: true,
        disableStdin: true,
        smoothScrollDuration: 250,
    }),
});

const divider = '-'.repeat(10);

@Directive({
    selector: 'ng-terminal[appTerminalOutput]',
    standalone: true,
    host: {
        // '[style.pointer-events]': "'none'",
    },
})
export class TerminalDirective implements AfterViewInit {
    readonly appTerminalOutput = input.required<TerminalKind>();

    private readonly term = inject(NgTerminalComponent);
    private readonly messagesService = inject(ApiMessagesService);
    private readonly termOpts = inject(TERMINAL_OPTIONS);
    private readonly destroyRef = inject(DestroyRef);
    private readonly injector = inject(Injector);
    private readonly elem = inject(ElementRef);

    ngAfterViewInit() {
        this.term.setXtermOptions(this.termOpts);
        const elem = (this.elem.nativeElement as HTMLElement);
        elem.addEventListener('focus', ev => {
            ev.preventDefault();
            this.elem.nativeElement.blur();
        });
        elem.addEventListener('touchstart', ev => {
            ev.preventDefault();
        });
        elem.addEventListener('mousedown', ev => {
            ev.preventDefault();
        });

        toObservable(this.appTerminalOutput, {
            injector: this.injector,
        }).pipe(
            takeUntilDestroyed(this.destroyRef),
            switchMap(kind => this.messagesService.messages(EventTypes.console).pipe(
                takeUntilDestroyed(this.destroyRef),
                filter(msg => filterStdioKind(msg, kind)),
            )),
        ).subscribe(msg => this.msgTermHandler(msg))
    }

    private msgTermHandler(msg: BaseMessage<any>) {
        switch (msg.kind) {
            case MessageKinds.start:
                return this.handleStart();
            case MessageKinds.exit:
                return this.handleExit(msg);
            case MessageKinds.stdio:
                return this.handleStdio(msg);
        }
    }

    private handleStdio(msg: BaseMessage<MessageKinds.stdio>) {
        this.term.write((msg as StdioMessage<any>).data);
    }

    private handleStart() {
        const term = this.term.underlying;
        if (term) {
            term.reset();
            term.clear();
            term.write(`${divider} start ${divider}\n`);
        }
    }

    private handleExit(msg: BaseMessage<MessageKinds.exit>) {
        const exitMsg = msg as ExitMessage;
        this.term.write(`${divider} exit(${exitMsg.code}) ${divider}\n`);
    }
}

function filterStdioKind(msg: ConsoleMessage, kind: TerminalKind): boolean {
    if (msg.kind === MessageKinds.stdio) {
        return getStdioMatchList(kind).includes(msg.stdio);
    }
    return true;
}

function getStdioMatchList(kind: TerminalKind): string[] {
    switch (kind) {
        case TerminalKinds.console:
            return [
                StdioKinds.stdout,
                StdioKinds.stdin,
                StdioKinds.stderr,
            ];
        case TerminalKinds.stdout:
            return [
                StdioKinds.stdout,
                StdioKinds.stdin,
            ];
        case TerminalKinds.stderr:
            return [
                StdioKinds.stderr
            ];
        default:
            return [];
    }
}

export enum TerminalKinds {
    console = 'console',
    stdout = 'stdout',
    stderr = 'stderr',
}

export type TerminalKind = keyof typeof TerminalKinds;
