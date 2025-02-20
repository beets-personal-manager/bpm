import {Directive, EventEmitter, HostListener, Inject, InjectionToken, Optional, Output} from '@angular/core';

export const DOUBLE_TAP_TIMEOUT = new InjectionToken<number>('DOUBLE_TAP_TIMEOUT', {factory: () => 400});

@Directive({
    selector: '[appTaps]',
    standalone: true
})
export class TapsDirective {
    @Output()
    dblTap = new EventEmitter<[number, number]>();
    @Output()
    tap = new EventEmitter<number>();

    private $prev?: number;

    constructor(
        @Optional() @Inject(DOUBLE_TAP_TIMEOUT) private readonly doubleTapTimeout: number,
    ) { }

    @HostListener('touchstart')
    onTouchStart(e?: TouchEvent) {
        const ts = new Date().getTime();
        if (this.$prev && ts <= (this.$prev + this.doubleTapTimeout)) {
            e?.preventDefault();
            this.dblTap.emit([this.$prev, ts]);
            this.$prev = undefined;
        } else {
            this.$prev = ts;
        }
    }
}
