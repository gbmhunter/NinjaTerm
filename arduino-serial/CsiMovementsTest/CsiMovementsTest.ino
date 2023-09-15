/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 */

#define DISPLAY_PERIOD_MS (2000)

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
}

void loop() {
  char * msg = "up\n\x1B[1A";
  for (uint8_t i = 0; i <= strlen(msg) - 1; i++) {
    Serial.print(msg[i]);
    delay(DISPLAY_PERIOD_MS);
  }
}



