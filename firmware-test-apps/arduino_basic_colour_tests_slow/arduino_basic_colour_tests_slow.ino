/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 * @last-modified 2016-09-27
 */

#define DISPLAY_PERIOD (1000)

void setup() {
  // Initialize serial communication
  Serial.begin(115200);
}

void loop() {
  char * textToPrint = "\x1B[31mred\x1B[32mgreen";
  uint8_t strLength = strlen(textToPrint);
  for (uint8_t idx = 0; idx < strLength; idx++) {
    Serial.print(textToPrint[idx]);
    delay(DISPLAY_PERIOD);
  }
}



