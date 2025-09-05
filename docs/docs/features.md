# NinjaTerm Features

NinjaTerm is an open source and free electron (or web-based) application designed for viewing debug serial port data and sending commands when developing firmware for an embedded device (e.g. microcontroller).

## ANSI Escape Code Support

Rich support for ANSI CSI colour codes, giving you ability to express information however you see fit! (e.g. colour errors red, warnings yellow).

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/ansi-escape-code-colours.webm" type="video/webm" />
  Demonstration of ANSI escape codes in NinjaTerm.
</video>

## Graphing

Extract data from your stream of debug data and graph it! Flexible options to extract data from text based serial streams, or dedicate the serial port for data only!

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/graphing.webm" type="video/webm" />
  Demonstration of graphing in NinjaTerm.
</video>

## Smart Scrolling

Most of the time you want to see the most recent information printed to the screen. NinjaTerm has a "scroll lock" feature to allow for that. However, scrolling up allows you to break the "scroll lock" and focus on previous info (e.g. an error that occurred). NinjaTerm will adjust the scroll point to keep that information in view even if the scrollback buffer is full.

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/smart-scroll.webm" type="video/webm" />
  Demonstration of smart scrolling in NinjaTerm.
</video>

## Show Invisible Characters

When debugging ASCII based data, sometimes unexpected "invisible" characters such as ASCII control characters or bytes above 0x7F (which are not part of ASCII) cause weird things to happen to your data! NinjaTerm contains a special font with glyphs for all ASCII control chars and all hex codes from 0x00 to 0xFF. Enable this mode from the settings to "see" any received byte of data!

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/control-char-and-hex-code-glyphs.webm" type="video/webm" />
  Demonstration of ASCII control character and hex code glyphs in NinjaTerm.
</video>

## Logging

Log your data to the file system for future retrieval or post analysis with other software. The file is written to once per second so your previous data should still be there even if the computer crashes/resets!

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/logging.webm" type="video/webm" />
  Demonstration of logging functionality in NinjaTerm.
</video>

## Filtering

Narrow down on the info you want by using filtering! Great for quickly finding errors, warnings, or debug prints from specific modules. Only rows of received data matching the filter text are shown. Clear the filter text to show all rows again.

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/filtering.webm" type="video/webm" />
  Demonstration of filtering functionality in NinjaTerm.
</video>

## Number Types

Don't just treat your data as ASCII! NinjaTerm also supports parsing received data as various numbers, including hex (variable byte length), uint8, int8, uint16, float32, e.t.c. View your data in the way you want it.

<video controls style={{maxWidth: '100%', width: '900px', height: 'auto', margin: 'auto'}}>
  <source src="/img/number-types.webm" type="video/webm" />
  Demonstration of number parsing in NinjaTerm.
</video>

## Additional Features

- Ability to switch between a combined TX/RX terminal and separate terminals.
- Options for controlling carriage return (CR) and line feed (LF) behavior.
- Smart copy/paste between the terminals and the clipboard with Ctrl-Shift-C and Ctrl-Shift-V. When copying to the clipboard, rows in the terminal created due to wrapping do not insert new lines into the clipboard data.
- Macros to send repetitive ASCII or HEX data easily.
- Send 200ms "break signals" with Ctrl-Shift-B.

## Browser Compatibility

For the web-based version, natively supported browsers include Chromium-based desktop browsers (e.g. Chrome, Edge, Brave) and Opera. Firefox is supported but you have to install the [WebSerial for Firefox extension](https://addons.mozilla.org/en-US/firefox/addon/webserial-for-firefox/) first. Unfortunately Safari is not supported (as of June 2024).

See the [MDN Web Serial API compatibility table](https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API#browser_compatibility) for a complete compatibility table.

## Performance

NinjaTerm can easily handle 50kB/s of incoming serial data when maximized on a 1920x1080 screen. Reported "CPU usage" inside the app (busy time of the main javascript event loop) is around 50% when this is happening on modern hardware.