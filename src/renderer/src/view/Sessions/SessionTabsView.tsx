import { useState } from 'react';
import { observer } from 'mobx-react-lite';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Tab,
  Tabs,
  TextField,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';

import { App } from 'src/model/App';
import { Session } from 'src/model/Session/Session';
import { ConnState } from 'src/model/Settings/PortSettings/PortSettings';

interface Props {
  app: App;
}

/** Tab-dot colour per connection state, matching the status bar's palette. */
const connStateColour: { [key in ConnState]: string } = {
  [ConnState.OPENED]: '#4caf50',
  [ConnState.CLOSED_BUT_WILL_REOPEN]: '#ff9800',
  [ConnState.CLOSED]: '#757575',
};

const TabLabel = observer(({ session, canClose, onClose }: { session: Session; canClose: boolean; onClose: () => void }) => (
  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <Box
      component="span"
      data-testid={`session-tab-conn-dot-${session.id}`}
      sx={{
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        backgroundColor: connStateColour[session.connController.connState],
        flexShrink: 0,
      }}
    />
    <Box component="span" sx={{ maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
      {session.name}
    </Box>
    {canClose && (
      // A <span>, not an <IconButton>: a button may not nest inside the tab's own button.
      <Box
        component="span"
        role="button"
        aria-label={`Close session ${session.name}`}
        data-testid={`session-tab-close-${session.id}`}
        onClick={(e: React.MouseEvent) => {
          e.stopPropagation();
          onClose();
        }}
        sx={{
          display: 'inline-flex',
          alignItems: 'center',
          borderRadius: '3px',
          padding: '1px',
          marginRight: '-4px',
          color: 'rgba(255,255,255,0.5)',
          '&:hover': { color: 'white', backgroundColor: 'rgba(255,255,255,0.12)' },
        }}
      >
        <CloseIcon sx={{ fontSize: '14px' }} />
      </Box>
    )}
  </Box>
));

/**
 * The strip of session tabs above the main pane. One tab per open session;
 * the "+" opens a new one with default settings. Right-click a tab for rename,
 * duplicate, reorder and close; double-click to rename; drag a tab onto
 * another to take its place.
 */
export default observer((props: Props) => {
  const { app } = props;

  const [menu, setMenu] = useState<{ session: Session; left: number; top: number } | null>(null);
  const [rename, setRename] = useState<{ session: Session; value: string } | null>(null);
  /** The tab being dragged and the tab it is currently over, during a reorder. */
  const [drag, setDrag] = useState<{ id: string; overId: string | null } | null>(null);

  const sessions = app.sessions;
  const canClose = sessions.length > 1;
  const menuIndex = menu === null ? -1 : sessions.indexOf(menu.session);

  const commitRename = () => {
    if (rename !== null) {
      app.renameSession(rename.session.id, rename.value);
    }
    setRename(null);
  };

  return (
    <Box
      data-testid="session-tabs"
      sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #404040', minHeight: '34px', flexShrink: 0 }}
      // Keys pressed while a tab has focus (arrows moving between tabs, Enter,
      // Space) must not bubble up to `App.handleKeyDown`, which would send
      // them to the terminal. Ctrl combinations are still the app's.
      onKeyDown={(e) => {
        if (!e.ctrlKey) {
          e.stopPropagation();
        }
      }}
    >
      <Tabs
        value={app.activeSessionId}
        onChange={(_e, id: string) => app.setActiveSession(id)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{
          minHeight: '34px',
          flexGrow: 1,
          '& .MuiTab-root': { minHeight: '34px', padding: '4px 10px', textTransform: 'none', fontSize: '0.85rem' },
        }}
      >
        {sessions.map((session, index) => {
          const isDragging = drag !== null && drag.id === session.id;
          const isDropTarget = drag !== null && drag.overId === session.id && !isDragging;
          return (
            <Tab
              key={session.id}
              value={session.id}
              data-testid={`session-tab-${session.id}`}
              onContextMenu={(e) => {
                e.preventDefault();
                setMenu({ session, left: e.clientX, top: e.clientY });
              }}
              onDoubleClick={() => setRename({ session, value: session.name })}
              // HTML5 drag-and-drop. Dropping on a tab moves the dragged session
              // into that tab's slot, shifting the others along.
              draggable
              onDragStart={(e) => {
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', session.id);
                setDrag({ id: session.id, overId: null });
              }}
              onDragOver={(e) => {
                if (drag === null) return;
                e.preventDefault(); // allow the drop
                e.dataTransfer.dropEffect = 'move';
                if (drag.overId !== session.id) setDrag({ ...drag, overId: session.id });
              }}
              onDragLeave={() => {
                if (drag !== null && drag.overId === session.id) setDrag({ ...drag, overId: null });
              }}
              onDrop={(e) => {
                e.preventDefault();
                const draggedId = drag?.id ?? e.dataTransfer.getData('text/plain');
                if (draggedId) app.moveSessionTo(draggedId, index);
                setDrag(null);
              }}
              onDragEnd={() => setDrag(null)}
              sx={{
                opacity: isDragging ? 0.4 : 1,
                // Highlight the slot the dragged tab would take.
                boxShadow: isDropTarget ? 'inset 0 0 0 1px #5eead4' : 'none',
                borderRadius: isDropTarget ? '4px' : 0,
              }}
              label={<TabLabel session={session} canClose={canClose} onClose={() => void app.closeSession(session.id)} />}
            />
          );
        })}
      </Tabs>

      <Tooltip title="New session" disableInteractive>
        <IconButton size="small" data-testid="new-session-button" onClick={() => app.newSession()} sx={{ margin: '0 4px' }}>
          <AddIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Menu
        open={menu !== null}
        onClose={() => setMenu(null)}
        anchorReference="anchorPosition"
        anchorPosition={menu === null ? undefined : { left: menu.left, top: menu.top }}
      >
        <MenuItem
          data-testid="session-menu-rename"
          onClick={() => {
            if (menu !== null) setRename({ session: menu.session, value: menu.session.name });
            setMenu(null);
          }}
        >
          Rename
        </MenuItem>
        <MenuItem
          data-testid="session-menu-duplicate"
          onClick={() => {
            if (menu !== null) app.newSession({ cloneFrom: menu.session });
            setMenu(null);
          }}
        >
          Duplicate
        </MenuItem>
        <MenuItem
          disabled={menuIndex <= 0}
          onClick={() => {
            if (menu !== null) app.moveSession(menu.session.id, -1);
            setMenu(null);
          }}
        >
          Move left
        </MenuItem>
        <MenuItem
          disabled={menuIndex === -1 || menuIndex >= sessions.length - 1}
          onClick={() => {
            if (menu !== null) app.moveSession(menu.session.id, 1);
            setMenu(null);
          }}
        >
          Move right
        </MenuItem>
        <MenuItem
          disabled={!canClose}
          data-testid="session-menu-close"
          onClick={() => {
            if (menu !== null) void app.closeSession(menu.session.id);
            setMenu(null);
          }}
        >
          Close
        </MenuItem>
      </Menu>

      <Dialog open={rename !== null} onClose={() => setRename(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Rename session</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            size="small"
            value={rename?.value ?? ''}
            onChange={(e) => setRename((r) => (r === null ? null : { ...r, value: e.target.value }))}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === 'Enter') commitRename();
            }}
            inputProps={{ 'data-testid': 'session-rename-input' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRename(null)}>Cancel</Button>
          <Button variant="contained" onClick={commitRename} data-testid="session-rename-confirm">
            Rename
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
});
