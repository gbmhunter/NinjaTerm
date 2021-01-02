/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2017-01-29
 * @last-modified 2017-01-29
 */

// the setup routine runs once when you press reset:
void setup() {
  // Initialize serial communication
  Serial.begin(19200);
}

void loop() {
  Serial.println("fast");
  // Wait until data is sent
  Serial.flush();
}



