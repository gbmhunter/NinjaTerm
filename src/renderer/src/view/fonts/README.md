# Terminal fonts

## NinjaTerm-Regular

NinjaTerm's own font, used as the default terminal font. `NinjaTerm.fcp` is the
[FontCreator](https://www.high-logic.com/font-editor/fontcreator) project file it
is built from.

It deliberately covers very little — printable ASCII, a few punctuation
characters, and two private-use blocks that the terminal depends on:

| Range | Purpose |
| --- | --- |
| U+E000–U+E01F | control-character glyphs (`START_OF_CONTROL_GLYPHS`) |
| U+E07F | DEL glyph |
| U+E100–U+E1FF | hex glyphs (`START_OF_HEX_GLYPHS`) |

Because those private-use glyphs exist nowhere else, NinjaTerm-Regular stays in
the terminal's `font-family` stack no matter which font the user selects — see
`TERMINAL_FONT_FALLBACK_STACK` in `DisplaySettings.ts`.

## WebPlus_IBM_VGA_8x16

The IBM VGA 8x16 DOS text-mode font, offered as the "IBM VGA (DOS/CP437)"
terminal font option. Covers the CP437 box-drawing and block-element characters
that text-mode UIs use to draw frames and borders, which NinjaTerm-Regular does
not have.

Taken from **The Ultimate Oldschool PC Font Pack v2.2** (the `web`/woff
distribution) by **VileR**, <https://int10h.org/oldschool-pc-fonts/>.

Licensed under a Creative Commons Attribution-ShareAlike 4.0 International
License — see `WebPlus_IBM_VGA-LICENSE.txt` for the full text, or
<http://creativecommons.org/licenses/by-sa/4.0/>. © 2016-2020 VileR.

The pack contains around 180 other fonts in the same format. Adding another is a
matter of dropping the `.woff` in here, adding an `@font-face` rule and an entry
to the `TerminalFont` enum.

## PerfectDOSVGA437

Perfect DOS VGA 437 by **Zeh Fernando**, <https://www.zehfernando.com/>, offered
as the "Perfect DOS VGA 437" terminal font option. Another DOS text-mode font
covering the CP437 box-drawing characters.

The original download ships two variants. This is **"Perfect DOS VGA 437 Win"**,
converted from TTF to woff — it is the variant that maps the box-drawing glyphs
at their real Unicode codepoints (U+2500-257F). The other variant
("Perfect DOS VGA 437", without "Win") instead places those glyphs at the legacy
DOS byte positions in the Latin-1 range, so `U+00C4` renders as `─` and accented
characters are wrong; that mapping is no use to NinjaTerm, which addresses glyphs
by Unicode codepoint.

Licensed per the author's own terms in `PerfectDOSVGA437-LICENSE.txt` (the
`dos437.txt` shipped in the original download):

> This is a free font/file, distribute as you wish to who you wish. You are free
> to use it on a movie, a videogame, a video, a broadcast, without having to ask
> my permission.
>
> Do NOT sell this font. It's not yours and you can't make money of it.

Redistributing it inside NinjaTerm is covered by that grant. Note the no-resale
condition applies to the font itself.
