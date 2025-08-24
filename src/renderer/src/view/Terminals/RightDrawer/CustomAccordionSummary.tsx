import { styled } from '@mui/material/styles';
import MuiAccordionSummary, { AccordionSummaryProps } from '@mui/material/AccordionSummary';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

// This code was modified from https://mui.com/material-ui/react-accordion/#customization
export const CustomAccordionSummary = styled((props: AccordionSummaryProps) => <MuiAccordionSummary expandIcon={<ArrowDownwardIcon sx={{ fontSize: '0.9rem' }} />} {...props} />)(
  ({ theme }) => ({
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, .05)' : 'rgba(0, 0, 0, .03)',
    flexDirection: 'row-reverse',
    '& .MuiAccordionSummary-expandIconWrapper.Mui-expanded': {
      transform: 'rotate(90deg)',
    },
    '& .MuiAccordionSummary-content': {
      marginLeft: theme.spacing(1),
    },
  })
);
