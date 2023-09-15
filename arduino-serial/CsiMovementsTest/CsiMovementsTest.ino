/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 */

#define DISPLAY_PERIOD_MS (500)

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
}

void loop() {
  // char * msg = "row1\nrow2\nrow3\nup1\x1B[1Aback1\x1B[1D";
  char * msg = "row1\nrow2\x1B[2D\x1B[1A\x1B[J";
  for (uint8_t i = 0; i <= strlen(msg) - 1; i++) {
    Serial.print(msg[i]);
    delay(DISPLAY_PERIOD_MS);
  }
}



