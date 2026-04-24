/**
 * Curated list of SEGGER J-Link target device identifiers surfaced as autocomplete
 * suggestions in the RTT Connection Settings UI. These are the most frequently used
 * chips; the device field is `freeSolo`, so users can still type any J-Link device
 * name verbatim if theirs isn't listed.
 *
 * Kept deliberately short — full J-Link device database has thousands of entries.
 * Add entries here as they come up.
 */
export const COMMON_JLINK_DEVICES: string[] = [
  // Nordic nRF51 / nRF52 / nRF53 / nRF54 / nRF91
  'nRF51822_xxAA',
  'nRF52805_xxAA',
  'nRF52810_xxAA',
  'nRF52811_xxAA',
  'nRF52820_xxAA',
  'nRF52832_xxAA',
  'nRF52833_xxAA',
  'nRF52840_xxAA',
  'nRF5340_xxAA_APP',
  'nRF5340_xxAA_NET',
  'nRF54L15_xxAA_APP',
  'nRF9151_xxCA',
  'nRF9160_xxAA',
  'nRF9161_xxCA',

  // ST STM32
  'STM32F030C8',
  'STM32F103C8',
  'STM32F401RE',
  'STM32F407VG',
  'STM32F411CE',
  'STM32F446RE',
  'STM32F746ZG',
  'STM32G031K8',
  'STM32G474RE',
  'STM32H743ZI',
  'STM32L476RG',
  'STM32L496RG',
  'STM32U575ZI',
  'STM32WB55RG',

  // Raspberry Pi RP2040 / RP2350
  'RP2040_M0_0',
  'RP2040_M0_1',
  'RP2350_M33_0',
  'RP2350_M33_1',

  // Espressif (RISC-V / Xtensa via J-Link)
  'ESP32_D0WD',
  'ESP32_S2',
  'ESP32_S3',
  'ESP32_C3',

  // NXP
  'MK64FN1M0xxx12',
  'MIMXRT1062xxx5A',

  // Microchip SAM
  'SAMD21G18A',
  'SAMD51J20A',
  'SAME70Q21',

  // Texas Instruments
  'CC1352R1F3',
  'CC2652R1F',
];
