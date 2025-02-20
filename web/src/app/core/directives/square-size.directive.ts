import {
    AfterViewChecked,
    DestroyRef,
    Directive,
    DoCheck,
    ElementRef,
    HostListener,
    inject,
    signal
} from '@angular/core';

@Directive({
    selector: '[appSquareSize]',
    host: {
        '[style.height.px]': "height()",
    },
})
export class SquareSizeDirective implements AfterViewChecked {
    readonly height = signal(0);
    private readonly elem = inject(ElementRef);

    ngAfterViewChecked() {
        this.onSizeChange();
    }

    @HostListener('window:resize')
    onSizeChange() {
        this.height.set(this.elem.nativeElement.offsetWidth);
    }
}
