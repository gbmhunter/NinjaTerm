import { Accordion, AccordionDetails, Button, Box, Typography, Tooltip } from '@mui/material';
import { observer } from 'mobx-react-lite';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { App } from '@/model/App';
import { PortState } from '@/model/Settings/PortSettings/PortSettings';
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
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title="Request To Send. Write only. Traditionally asserted by the DTE (e.g. computer) to the DCE (e.g. modem) to indicate that it is ready to send data. Commonly used for hardware flow control."
            placement="left"
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setRts(!serialController.getRts())}
              >
                RTS
              </Button>
            </Box>
            </Tooltip>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FlowControlIndicator
                label="RTS"
                active={serialController.getRts()}
              />
            </Box>

          {/* Row 2: CTS */}
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title="Clear To Send. Read/write. Commonly used for hardware flow control. If you set this and it quickly changes, it means the other end is driving the signal."
            placement="left"
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setCts(!serialController.getCts())}
              >
                CTS
              </Button>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="CTS"
              active={serialController.getCts()}
            />
          </Box>

          {/* Row 3: DTR */}
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title="Data Terminal Ready. Write only. Traditionally asserted by the DTE when it was ready to receive data. Not as commonly used for flow control as RTS/CTS. Some older devices used DTR and RTS as a source of power."
            placement="left"
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setDtr(!serialController.getDtr())}
              >
                DTR
              </Button>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="DTR"
              active={serialController.getDtr()}
            />
          </Box>

          {/* Row 4: DSR */}
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title="Data Set Ready. Read/write. Traditionally sent by the DCE (e.g. modem) to the DTE (e.g. computer) to indicate that the DCE is ready to receive data. If you set this and it quickly changes, it means the other end is driving the signal."
            placement="left"
          >
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                sx={{ minWidth: 50, fontSize: '10px' }}
                disabled={!isPortOpen}
                onClick={() => serialController.setDsr(!serialController.getDsr())}
              >
                DSR
              </Button>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="DSR"
              active={serialController.getDsr()}
            />
          </Box>

          {/* Row 5: DCD (read-only) */}
          <Tooltip
            {...app.settings.displaySettings.getBasicTooltipConfig()}
            title="Data Carrier Detect. Read only. Was traditionally driven high (asserted, 1) by the modem (DCE) when it detected a carrier signal, which meant it was connected to another modem on the other end."
            placement="left"
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '10px' }}>
                DCD
              </Typography>
            </Box>
          </Tooltip>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlowControlIndicator
              label="DCD"
              active={serialController.getDcd()}
            />
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
});
