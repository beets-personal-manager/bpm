import {Resolvable} from '../util/resolvable';
import {inject} from '@angular/core';
import {ApiConfigService} from '../services/api/api-config.service';

export const queriesResolver = Resolvable(() => inject(ApiConfigService).queries());
