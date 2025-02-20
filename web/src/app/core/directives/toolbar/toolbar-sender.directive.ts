import {AfterViewInit, DestroyRef, Directive, Injector, input, TemplateRef} from '@angular/core';
import {takeUntilDestroyed, toObservable} from '@angular/core/rxjs-interop';
import {ToolbarChannelService} from './toolbar-channel.service';
import {BehaviorSubject} from 'rxjs';

@Directive({
    selector: 'ng-template[appToolbarSender]',
    standalone: true,
})
export class ToolbarSenderDirective implements AfterViewInit {
    readonly appToolbarSender = input(0);
    readonly context = input<any>();
    readonly injector = input<Injector>();
    private readonly index$ = toObservable(this.appToolbarSender);

    constructor(
        private readonly template: TemplateRef<any>,
        private readonly toolbarChannel: ToolbarChannelService,
        private readonly destroyRef: DestroyRef,
    ) {  }

    ngAfterViewInit() {
        this.toolbarChannel.send(new BehaviorSubject({
            index: this.index$,
            template: this.template,
            context: this.context(),
            injector: this.injector(),
        }).pipe(
            takeUntilDestroyed(this.destroyRef),
        ));
    }
}
