/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 * @last-modified 2016-09-27
 */

char messages[][80] = {

  { "\x1B[32mTEMP: Measured temperature = 21C." },
  { "\x1B[32mTEMP: Measured temperature = 24C." },
  { "\x1B[31;1mGPS: ERROR - GPS signal has been lost." },
  { "\x1B[31;1mSLEEP: ERROR - Requested sleep while peripherals still active." },
  { "\x1B[32;1mCLOCK: Time is now 14:23:45" },
  { "\x1B[32;1mCLOCK: Time is now 09:12:24" },
  { "\x1B[33;1mWATCHDOG: Watchdog fed." },
  { "\x1B[33;1mWATCHDOG: Watchdog expired.  Resetting micro..." },
  { "\x1B[34;1mBLU: New device found." },
  { "\x1B[34;1mBLU: Connecting to new device..." },
  { "\x1B[34;1mBLU: Bluetooth connection refreshed." },
  { "\x1B[35;1mSLEEP: In low power mode." },
  { "\x1B[35;1mSLEEP: In medium power mode." },
  { "\x1B[35;1mSLEEP: In high power mode." },
  { "\x1B[35;1mSLEEP: Sleeping..." },
  { "\x1B[36;1mXTAL: External crystal frequency changed to 20MHz." },
  { "\x1B[36;1mXTAL: External crystal frequency changed to 40MHz." },
  { "\x1B[37;1mLED: Status LED set to mode = \"flashing\"." },
  { "\x1B[37;1mLED: Status LED set to mode = \"continuous\"." },
};


// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

void loop() {

  int messageNum = random(sizeof(messages)/sizeof(messages[0]) - 1);
  Serial.println(messages[messageNum]);

  if(random(100) < 50) {
    delay(random(1000));
  } else {
    delay(random(100));
  }
  
  
  
  /*Serial.println("\x1B[31;1mGPS: ERROR - GPS signal has been lost.");
  delayRandom();
  Serial.println("\x1B[32;1mCLOCK: Time is now 14:23:45");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[33;1mWATCHDOG: Watchdog feed.");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[34;1mBLU: Bluetooth connection refreshed.");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[35;1mSLEEP: In medium power mode.");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[36;1mXTAL: External crystal frequency changed to 20MHz.");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[37;1mLED: Status LED set to mode = \"flashing\".");
  delay(DISPLAY_PERIOD);*/

  /*Serial.println("\x1B[30;1mbold black");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[31;1mbold red");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[32;1mbold green");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[33;1mbold brown/yellow");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[34;1mbold blue");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[35;1mbold magenta");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[36;1mbold cyan");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[37;1mbold grey");
  delay(DISPLAY_PERIOD);*/
}



