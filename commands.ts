import disable from './commands/codebase/disable.ts';
import enable from './commands/codebase/enable.ts';
import list from './commands/codebase/list.ts';
import select from './commands/codebase/select.ts';
import set from './commands/codebase/set.ts';
import showRepo from './commands/codebase/showRepo.ts';

export default [select, enable, disable, set, list, showRepo];
