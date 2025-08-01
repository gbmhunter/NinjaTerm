/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-22
 * @last-modified 2016-11-22
 */

// the setup routine runs once when you press reset:
void setup() {
  // Initialize serial communication at 115200 bits per second
  Serial.begin(115200);
}

void loop() {

#define DISPLAY_PERIOD (50)

  Serial.println("fast ");
  // Wait until data is sent
  Serial.flush();
  delay(DISPLAY_PERIOD);
}



