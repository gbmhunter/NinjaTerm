import { Accordion, AccordionDetails, Button, Box, Typography } from '@mui/material';
import { observer } from 'mobx-react-lite';
import { App } from 'src/model/App';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

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

  return (
    <Accordion disableGutters expanded={rightDrawer.flowControlIsExpanded} onChange={rightDrawer.handleFlowControlAccordionChange} sx={{ width: '100%' }}>
      <CustomAccordionSummary expandIcon={<ArrowDownwardIcon />} data-testid="flow-control-accordion-summary">
        Flow Control
      </CustomAccordionSummary>
      <AccordionDetails>
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: '70px 70px 70px',
          gridTemplateRows: 'auto auto auto auto',
          gap: 1,
          maxWidth: '240px',
          alignItems: 'center'
        }}>
          {/* Column headers */}
          <Typography variant="caption" sx={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Controls
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Outputs
          </Typography>
          <Typography variant="caption" sx={{ fontSize: '10px', color: '#888', textAlign: 'center' }}>
            Inputs
          </Typography>

          {/* Row 1: RTS, RTS indicator, CTS indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 50, fontSize: '10px' }}
              onClick={() => serialController.setRts(!serialController.currentFlowControlState?.rts)}
            >
              RTS
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <FlowControlIndicator
              label="RTS"
              active={serialController.currentFlowControlState?.rts || false}
            />
            <Typography variant="caption" sx={{ fontSize: '11px' }}>RTS</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <FlowControlIndicator
              label="CTS"
              active={serialController.currentFlowControlState?.cts || false}
            />
            <Typography variant="caption" sx={{ fontSize: '11px' }}>CTS</Typography>
          </Box>

          {/* Row 2: DTR, DTR indicator, DSR indicator */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="outlined"
              size="small"
              sx={{ minWidth: 50, fontSize: '10px' }}
              onClick={() => serialController.setDtr(!serialController.currentFlowControlState?.dtr)}
            >
              DTR
            </Button>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <FlowControlIndicator
              label="DTR"
              active={serialController.currentFlowControlState?.dtr || false}
            />
            <Typography variant="caption" sx={{ fontSize: '11px' }}>DTR</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <FlowControlIndicator
              label="DSR"
              active={serialController.currentFlowControlState?.dsr || false}
            />
            <Typography variant="caption" sx={{ fontSize: '11px' }}>DSR</Typography>
          </Box>

          {/* Row 3: Empty, Empty, DCD indicator */}
          <Box></Box>
          <Box></Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
            <FlowControlIndicator
              label="DCD"
              active={serialController.currentFlowControlState?.dcd || false}
            />
            <Typography variant="caption" sx={{ fontSize: '11px' }}>DCD</Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
});
