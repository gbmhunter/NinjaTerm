import { useState } from 'react';
import {
  Badge,
  Box,
  Button,
  Checkbox,
  IconButton,
  Popover,
  TextField,
  ToggleButton,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import FilterListIcon from '@mui/icons-material/FilterList';
import { observer } from 'mobx-react-lite';

import { FilterController } from 'src/model/Terminals/Filters/FilterController';
import { TerminalFilter } from 'src/model/Terminals/Filters/TerminalFilter';

interface FilterRowProps {
  filter: TerminalFilter;
  index: number;
  onDelete: (index: number) => void;
}

const FilterRow = observer((props: FilterRowProps) => {
  const { filter, index, onDelete } = props;
  const showError = filter.useRegex && filter.errorMsg !== '';
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '4px' }}>
      <Tooltip title="Enable/disable this filter." placement="left">
        <Checkbox
          size="small"
          checked={filter.enabled}
          onChange={(e) => filter.setEnabled(e.target.checked)}
          sx={{ padding: '4px' }}
          data-testid="filter-enabled-checkbox"
        />
      </Tooltip>
      <TextField
        size="small"
        variant="outlined"
        placeholder="Filter pattern"
        value={filter.pattern}
        onChange={(e) => filter.setPattern(e.target.value)}
        error={showError}
        helperText={showError ? filter.errorMsg : ''}
        InputProps={{ style: { height: '32px' } }}
        sx={{ width: '180px' }}
        data-testid="filter-pattern-input"
      />
      <Tooltip title="Match as a regular expression." placement="top">
        <ToggleButton
          value="useRegex"
          size="small"
          selected={filter.useRegex}
          onChange={() => filter.setUseRegex(!filter.useRegex)}
          sx={{ height: '32px', minWidth: '32px', padding: '4px', fontFamily: 'monospace' }}
          data-testid="filter-regex-toggle"
        >
          .*
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Match case-sensitively." placement="top">
        <ToggleButton
          value="caseSensitive"
          size="small"
          selected={filter.caseSensitive}
          onChange={() => filter.setCaseSensitive(!filter.caseSensitive)}
          sx={{ height: '32px', minWidth: '32px', padding: '4px' }}
          data-testid="filter-case-toggle"
        >
          Aa
        </ToggleButton>
      </Tooltip>
      <Tooltip title="Remove this filter." placement="right">
        <IconButton
          size="small"
          color="error"
          onClick={() => onDelete(index)}
          sx={{ padding: '4px' }}
          data-testid="filter-delete-button"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
});

interface Props {
  filterController: FilterController;
}

/**
 * Toolbar control for the multiple-terminal-filters feature. Renders a
 * "Filters" button (badged with the active-filter count) that opens a popover
 * holding the editable list of filters. Rows are shown if they match ANY
 * active filter (match-any / OR).
 */
export default observer((props: Props) => {
  const { filterController } = props;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const activeCount = filterController.activeFilters.length;

  return (
    <>
      <Tooltip
        title={
          <div>
            Filter the rows shown in the terminal. A row is shown if it matches any enabled filter (logical OR). Each filter can be a plain substring or a regular expression, with
            optional case-sensitivity.
            <ul>
              <li>The row the cursor is on is always shown.</li>
              <li>Disable or remove all filters to show everything.</li>
            </ul>
          </div>
        }
        placement="left"
      >
        <Button
          variant="outlined"
          color="primary"
          startIcon={
            <Badge badgeContent={activeCount} color="primary">
              <FilterListIcon />
            </Badge>
          }
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ height: '35px' }}
          data-testid="filters-button"
        >
          Filters
        </Button>
      </Tooltip>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '12px', minWidth: '360px' }}>
          <Typography variant="subtitle2">Filters (match any)</Typography>
          {filterController.filters.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              No filters. Add one to start filtering the terminal.
            </Typography>
          ) : (
            filterController.filters.map((filter, index) => (
              <FilterRow key={index} filter={filter} index={index} onDelete={filterController.deleteFilter} />
            ))
          )}
          <Button
            variant="outlined"
            size="small"
            startIcon={<AddIcon />}
            onClick={filterController.addFilter}
            sx={{ alignSelf: 'flex-start' }}
            data-testid="filter-add-button"
          >
            Add filter
          </Button>
        </Box>
      </Popover>
    </>
  );
});
