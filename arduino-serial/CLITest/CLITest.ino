/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 * @last-modified 2016-09-27
 */

char * prompt = "\x1B[1;32mcli:$\x1B[0m ";
uint8_t printableCharsInPrompt = 6;

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);

  // Print prompt to UART
  Serial.write(prompt);
}

/*
[1B][8D[1B][J-- [00:10:53.854,217] [1B][0m<inf> Bsp: Toggle all leds[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J-- [00:10:54.054,290] [1B][0m<inf> Bsp: Toggle all leds[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J-- [00:10:54.254,394] [1B][0m<inf> Bsp: Toggle all leds[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J-- [00:10:54.254,425] [1B][0m<inf> Main: Tick[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J[1B][1;32muart:~$ [1B][m
*/

char rxBuffer[100] = {0};
uint8_t rxBufferPos = 0;

uint32_t lastMsgTime_ms = 0;

char messages[][80] = {

  { "TEMP: Measured temperature = 21C." },
  { "TEMP: Measured temperature = 24C." },
  { "\x1B[31;1mGPS: ERROR - GPS signal has been lost." },
  { "\x1B[31;1mSLEEP: ERROR - Requested sleep while peripherals still active." },
  { "CLOCK: Time is now 14:23:45" },
  { "CLOCK: Time is now 09:12:24" },
  { "WATCHDOG: Watchdog fed." },
  { "\x1B[31;1mWATCHDOG: Watchdog expired. Resetting micro..." },
  { "BLU: New device found." },
  { "BLU: Connecting to new device..." },
  { "BLU: Bluetooth connection refreshed." },
  { "SLEEP: In low power mode." },
  { "SLEEP: In medium power mode." },
  { "SLEEP: In high power mode." },
  { "SLEEP: Sleeping..." },
  { "XTAL: External crystal frequency changed to 20MHz." },
  { "XTAL: External crystal frequency changed to 40MHz." },
  { "LED: Status LED set to mode = \"flashing\"." },
  { "LED: Status LED set to mode = \"continuous\"." },
};

void loop() {

  if (Serial.available()) {
    uint8_t rxChar = Serial.read();
    // Echo character back
    Serial.write(rxChar);
    rxBuffer[rxBufferPos] = rxChar;
    rxBufferPos += 1;
    if (rxChar == '\n') {
      Serial.println("Hello");
      rxBufferPos = 0;
      Serial.print(prompt);
    }
  }

  uint32_t currTime_ms = millis();
  if (currTime_ms > lastMsgTime_ms + 500) {
    int messageNum = random(sizeof(messages)/sizeof(messages[0]) - 1);
    sendMsg(messages[messageNum]);
    lastMsgTime_ms = currTime_ms;
  }

}

void sendMsg(char * msg) {
  // Go back and overwrite data user has sent
  uint32_t numCharsToGoBack = printableCharsInPrompt + rxBufferPos;
  char tempBuff[50];
  snprintf(tempBuff, sizeof(tempBuff), "\x1B[%uD", numCharsToGoBack);
  Serial.print(tempBuff);
  // Now erase from cursor to end of screen
  Serial.print("\x1B[J");

  // Now print message
  Serial.print(msg);
  Serial.print("\n");

  // Now replace with prompt
  Serial.print(prompt);
  Serial.write(rxBuffer, rxBufferPos);
}



