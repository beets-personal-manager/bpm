import {Resolvable, Resolver} from '../util/resolvable';
import {inject} from '@angular/core';
import {NavService} from '../services/nav.service';

export const navLibraryAlbumGroupResolver = Resolvable(() => inject(NavService).navRootGroup.navLibrary.navLibraryAlbums.navGroup);
