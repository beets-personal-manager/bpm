import {AfterViewInit, DestroyRef, Directive, Injector, ViewContainerRef, ViewRef} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ToolbarChannelService, ToolbarTemplate} from './toolbar-channel.service';
import {distinctUntilChanged, Observable, ReplaySubject, takeUntil} from 'rxjs';

@Directive({
    selector: '[appToolbarReceiver]',
    standalone: true,
})
export class ToolbarReceiverDirective implements AfterViewInit {
    constructor(
        private readonly toolbarChannel: ToolbarChannelService,
        private readonly destroyRef: DestroyRef,
        private readonly viewContainerRef: ViewContainerRef,
    ) { }

    ngAfterViewInit() {
        this.toolbarChannel.receive().pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(t => this.createToolbar(t));
    }

    private createToolbar(o: Observable<ToolbarTemplate>) {
        const completed = new ReplaySubject<void>(1);
        o.pipe(
            takeUntilDestroyed(this.destroyRef),
        ).subscribe({
            complete: () => {
                completed.next();
                completed.complete();
            },
            next: t => {
                const v = t.template.createEmbeddedView(t.context ?? {}, t.injector);
                v.detectChanges();
                v.onDestroy(() => {
                    completed.next();
                    completed.complete();
                });

                let first = true;
                t.index.pipe(
                    takeUntilDestroyed(this.destroyRef),
                    takeUntil(completed),
                    distinctUntilChanged(),
                ).subscribe(idx => {
                    let insertFn: (v: ViewRef, idx: number) => void;
                    if (first) {
                        insertFn = this.viewContainerRef.insert.bind(this.viewContainerRef);
                        first = false;
                    } else {
                        insertFn = this.viewContainerRef.move.bind(this.viewContainerRef);
                    }

                    if (this.viewContainerRef.length < idx) {
                        this.viewContainerRef.insert(v);
                    } else {
                        insertFn(v, idx);
                    }
                });

                completed.pipe(
                    takeUntilDestroyed(this.destroyRef),
                ).subscribe({
                    complete: () => {
                        v.detach();
                        v.destroy();
                    }
                });
            },
        });
    }
}
