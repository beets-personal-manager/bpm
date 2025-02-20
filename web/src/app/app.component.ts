import {
    AfterViewInit,
    Component,
    computed,
    ElementRef, HostBinding,
    inject,
    Pipe,
    PipeTransform,
    signal,
    viewChild
} from '@angular/core';
import {RouterLink, RouterOutlet} from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbar, MatToolbarModule} from '@angular/material/toolbar';
import {takeUntilDestroyed, toObservable, toSignal} from '@angular/core/rxjs-interop';
import {combineLatest, endWith, filter, map, merge, ReplaySubject, startWith, Subject} from 'rxjs';
import {ToolbarReceiverDirective} from './core/directives/toolbar/toolbar-receiver.directive';
import {NavLink, NavService} from './core/services/nav.service';
import {CommonModule} from '@angular/common';
import {MatListModule} from '@angular/material/list';
import {MatIconModule} from '@angular/material/icon';
import {MatButtonModule} from '@angular/material/button';
import {APPLICATION_NAME} from './app.config';
import {MatTreeModule} from '@angular/material/tree';
import {ArrayDataSource} from '@angular/cdk/collections';
import {SnackbarService} from './core/services/snackbar.service';
import {MatTooltipModule} from '@angular/material/tooltip';
import {BreakpointObserver, Breakpoints} from '@angular/cdk/layout';

@Pipe({
    name: 'navNodeCheck',
    standalone: true,
})
class NavNodeCheckPipe implements PipeTransform {
    transform(value: any): NavNode {
        if (!('link' in value)) {
            throw new Error('not a nav node');
        }
        return value;
    }
}

@Component({
    selector: 'app-root',
    imports: [
        RouterOutlet,
        MatSidenavModule,
        MatToolbarModule,
        ToolbarReceiverDirective,
        CommonModule,
        RouterLink,
        MatListModule,
        MatIconModule,
        MatButtonModule,
        MatTreeModule,
        NavNodeCheckPipe,
        MatTooltipModule,
    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss',
    standalone: true,
})
export class AppComponent implements AfterViewInit {
    readonly appName = inject(APPLICATION_NAME);

    @HostBinding('class.is-handset') isHandsetClass = false;
    private readonly isHandset$ = inject(BreakpointObserver).observe(
        Breakpoints.Handset,
    ).pipe(
        takeUntilDestroyed(),
        map(result => result.matches),
        startWith(false),
    );
    readonly isHandset = toSignal(this.isHandset$, {initialValue: false});

    readonly navService = inject(NavService);
    readonly navRoot = this.navService.navRootGroup;

    readonly navState = signal(false);
    readonly navOpened = computed(() => {
        const state = this.navState();
        if (this.isHandset()) {
            return state;
        }
        return false;
    });

    readonly hasChild = (_: number, node: NavNode) => node.expandable;
    readonly levelAccessor = (node: NavNode) => node.level;
    readonly sidenavDataSource = new ArrayDataSource([...this.navRoot].reduce((acc, e) => acc.concat(reduceNavTree(0, e)), Array<NavNode>()));

    private readonly afterViewInit = new ReplaySubject<void>();
    private readonly matToolbarElem = viewChild(MatToolbar, {read: ElementRef});
    readonly toolbarHeight = toSignal(combineLatest({
        elem: toObservable(this.matToolbarElem).pipe(
            map(e => e?.nativeElement as HTMLElement),
            filter(e => !!e),
        ),
        _: merge(
            this.isHandset$,
            this.afterViewInit.pipe(endWith(null)),
        ),
    }).pipe(
        takeUntilDestroyed(),
        map(({elem}) => elem.offsetHeight),
    ), {initialValue: 0});

    constructor() {
        this.isHandset$.pipe(takeUntilDestroyed()).subscribe(ih => this.isHandsetClass = ih);
    }

    ngAfterViewInit() {
        this.afterViewInit.complete();
    }

    navStateClick(node: NavNode) {
        if (!node.link.disabled) {
            this.navState.set(false);
        }
    }
}

function reduceNavTree(level: number, e: NavLink): NavNode[] {
    const children = [...e.navGroup];
    const newNode = {
        level,
        expandable: level === 0,
        link: e,
    };

    return [
        newNode,
        ...children.reduce((acc, l) => [...acc, ...reduceNavTree(level+1, l)], [] as NavNode[]),
    ];
}

type NavNode = {
    expandable: boolean;
    level: number;
    link: NavLink;
};
