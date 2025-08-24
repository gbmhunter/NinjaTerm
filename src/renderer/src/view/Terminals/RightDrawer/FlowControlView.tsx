import { Accordion, AccordionDetails, Button, Box, Typography, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { App } from 'src/model/App';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { PortState } from 'src/model/Settings/PortSettings/PortSettings';

import { CustomAccordionSummary } from './CustomAccordionSummary';

interface Props {
  app: App;
}

interface FlowControlIndicatorProps {
  label: string;
  active: boolean;
}

const FlowControlIndicator = ({ label, active }: FlowControlIndicatorProps) => {
  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 32,
        height: 32,
        borderRadius: '50%',
        backgroundColor: active ? '#4caf50' : '#666',
        color: active ? '#fff' : '#ccc',
        fontSize: '14px',
        fontWeight: 'bold',
        boxShadow: active ? '0 0 8px rgba(76, 175, 80, 0.6)' : 'none',
        transition: 'all 0.3s ease',
        marginRight: 1,
        border: active ? '2px solid #4caf50' : '2px solid #666',
      }}
    >
      {active ? '1' : '0'}
    </Box>
  );
};

export default observer((props: Props) => {
  const { app } = props;
  const rightDrawer = app.terminals.rightDrawer;
  const serialController = app.serialController;
  const isPortOpen = serialController.portState === PortState.OPENED;

  return (
    <Accordion disableGutters expanded={rightDrawer.flowControlIsExpanded} onChange={rightDrawer.handleFlowControlAccordionChange} sx={{ width: '100%' }}>
      <CustomAccordionSummary expandIcon={<ArrowDownwardIcon />} data-testid="flow-control-accordion-summary">
        Flow Control
      </CustomAccordionSummary>
      <AccordionDetails>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '80px 80px',
          gridTemplateRows: 'auto auto auto auto auto auto',
          gap: 1,
          maxWidth: '180px',
          alignItems: 'center'
        }}>
          {/* Column headers */}
          <Typography variant="caption" sx={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Controls
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Status
          </Typography>

          {/* Row 1: RTS */}
          <Tooltip title="Request To Send. Write only. Commonly used for hardware flow control.">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setRts(!serialController.currentFlowControlState.rts)}
              >
                RTS
              </Button>
            </Box>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlowControlIndicator
                label="RTS"
                active={serialController.currentFlowControlState.rts}
              />
            </Box>

          {/* Row 2: CTS */}
          <Tooltip title="Clear To Send. Read/write. Commonly used for hardware flow control. If you set this and it quickly changes, it means the other end is driving the signal.">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setCts(!serialController.currentFlowControlState.cts)}
              >
                CTS
              </Button>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="CTS"
              active={serialController.currentFlowControlState.cts}
            />
          </Box>

          {/* Row 3: DTR */}
          <Tooltip title="Data Terminal Ready. Write only.">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setDtr(!serialController.currentFlowControlState.dtr)}
              >
                DTR
              </Button>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="DTR"
              active={serialController.currentFlowControlState.dtr}
            />
          </Box>

          {/* Row 4: DSR */}
          <Tooltip title="Data Set Ready. Read/write. If you set this and it quickly changes, it means the other end is driving the signal.">
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setDsr(!serialController.currentFlowControlState.dsr)}
              >
                DSR
              </Button>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="DSR"
              active={serialController.currentFlowControlState.dsr}
            />
          </Box>

          {/* Row 5: DCD (read-only) */}
          <Tooltip title="Data Carrier Detect. Read only.">
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '10px', color: '#666' }}>
                DCD
              </Typography>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="DCD"
              active={serialController.currentFlowControlState.dcd}
            />
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
});
