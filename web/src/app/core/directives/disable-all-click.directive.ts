import {DestroyRef, Directive, ElementRef} from "@angular/core";

@Directive({
    selector: '[disableAllClick]',
    host: {
        '[style.pointer-events]': "'none'",
    },
})
export class DisableAllClickDirective {
    constructor(
        el: ElementRef,
        dr: DestroyRef,
    ) {
        const mo = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach((node) => {
                    if (node instanceof HTMLElement) {
                        node.onclick = ev => ev.stopPropagation();
                    }
                });
            })
        });
        mo.observe(el.nativeElement, {
            attributes: false,
            childList: true,
            characterData: false,
            subtree: true,
        });

        dr.onDestroy(() => {
            mo.disconnect();
            mo.takeRecords();
        });
    }
}
