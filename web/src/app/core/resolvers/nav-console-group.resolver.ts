import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {NavService} from '../services/nav.service';

export const navConsoleGroupResolver = Resolvable(() => inject(NavService).navRootGroup.navConsole.navGroup);
