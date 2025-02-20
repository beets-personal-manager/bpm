import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {NavService} from '../services/nav.service';

export const navLibraryGroupResolver = Resolvable(() => inject(NavService).navRootGroup.navLibrary.navGroup);
