import {fieldsResolver} from '../../../../core/resolvers/fields.resolver';
import {
    AbstractLibraryToolbarFilterButtonDatasource
} from '../library-toolbar-filter-button/abstract-library-toolbar-filter-button.datasource';
import {LibraryParams} from '../../../../core/services/api/api-library.service';

export class LibraryToolbarFieldsSelectorDatasource extends AbstractLibraryToolbarFilterButtonDatasource {
    constructor() {
        super(fieldsResolver, true, LibraryParams.IncludeKeys);
    }
}
