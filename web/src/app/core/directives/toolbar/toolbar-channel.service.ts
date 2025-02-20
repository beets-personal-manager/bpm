import {DestroyRef, Injectable, Injector, TemplateRef} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

@Injectable({
    providedIn: 'root'
})
export class ToolbarChannelService {
    private readonly channel = new Subject<Observable<ToolbarTemplate>>();

    constructor(
        private readonly destroyRef: DestroyRef,
    ) {  }


    send(o: Observable<ToolbarTemplate>) {
        this.channel.next(o.pipe(takeUntilDestroyed(this.destroyRef)));
    }

    receive(): Observable<Observable<ToolbarTemplate>> {
        return this.channel.pipe(takeUntilDestroyed(this.destroyRef));
    }
}

export type ToolbarTemplate = {
    template: TemplateRef<any>;
    index: Observable<number>;
    context?: any;
    injector?: Injector;
};
