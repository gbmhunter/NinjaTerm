import { Box, Button, Tooltip } from '@mui/material';

import kofiSymbol from './kofi_symbol.svg';

/** Ko-fi's brand blue, carried over from the button this replaces. */
const KOFI_BLUE = '#29abe0';

interface Props {
  /** The Ko-fi page ID, i.e. the `ko-fi.com/<id>` part of the URL. */
  kofiId: string;
  /** Hide the label and show just the cup, matching the toolbar's other buttons. */
  compact?: boolean;
}

/**
 * "Support me on Ko-fi" button.
 *
 * Replaces the `kofi-button` package, which rendered its markup through
 * `dangerouslySetInnerHTML` and pulled three things off the network every time
 * the terminal pane mounted: a Google Fonts stylesheet for the Quicksand
 * typeface, and two images from Ko-fi's CDN. NinjaTerm is an offline tool for
 * embedded work, so a donate button is not worth a phone-home to two third
 * parties — and on an air-gapped machine those requests just hang.
 *
 * This draws the same button locally: brand blue, white bold label, and Ko-fi's
 * official cup symbol from their brand pack (`kofi_symbol.svg`, alongside this
 * file). Vite inlines it as a data URI — it is under the 4 KB asset limit — so
 * the mark ships inside the bundle with no request of any kind.
 *
 * The symbol is kept as the unmodified file rather than pasted in as JSX paths,
 * so refreshing it from Ko-fi's brand pack later is a straight file copy. The
 * `alt` is empty because the button's own label and tooltip already name it.
 *
 * The click goes through `shell.openExternal` rather than an `<a href>`, so
 * the page opens in the user's own browser. (The `setWindowOpenHandler` in the
 * main process would now route a `target="_blank"` link there anyway, but
 * going direct is clearer about the intent.)
 */
export default function KofiDonateButton({ kofiId, compact = false }: Props) {
  const url = `https://ko-fi.com/${kofiId}`;

  const openKofiPage = () => {
    window.electronAPI.shell.openExternal(url);
  };

  return (
    <Tooltip title="Support NinjaTerm on Ko-fi. Opens in your browser.">
      <Button
        variant="contained"
        onClick={openKofiPage}
        startIcon={<Box component="img" src={kofiSymbol} alt="" sx={{ height: '18px' }} />}
        data-testid="kofi-donate-button"
        sx={{
          backgroundColor: KOFI_BLUE,
          '&:hover': { backgroundColor: KOFI_BLUE, opacity: 0.85 },
          color: '#fff',
          fontWeight: 700,
          borderRadius: '7px',
          textTransform: 'none',
          whiteSpace: 'nowrap',
          // The original button gave its cup a periodic wiggle; keep the
          // character, without the remote image it used to animate.
          '@keyframes kofiWiggle': {
            '0%, 60%': { transform: 'rotate(0) scale(1)' },
            '75%': { transform: 'rotate(0) scale(1.12)' },
            '80%': { transform: 'rotate(0) scale(1.1)' },
            '84%': { transform: 'rotate(-10deg) scale(1.1)' },
            '88%': { transform: 'rotate(10deg) scale(1.1)' },
            '92%': { transform: 'rotate(-10deg) scale(1.1)' },
            '96%': { transform: 'rotate(10deg) scale(1.1)' },
            '100%': { transform: 'rotate(0) scale(1)' },
          },
          '& .MuiButton-startIcon': {
            animation: 'kofiWiggle 3s infinite',
            marginRight: compact ? '0px' : undefined,
            marginLeft: compact ? '0px' : undefined,
          },
          // Respect a reduced-motion preference rather than wiggling regardless.
          '@media (prefers-reduced-motion: reduce)': {
            '& .MuiButton-startIcon': { animation: 'none' },
          },
        }}
      >
        {compact ? '' : 'Donate'}
      </Button>
    </Tooltip>
  );
}
