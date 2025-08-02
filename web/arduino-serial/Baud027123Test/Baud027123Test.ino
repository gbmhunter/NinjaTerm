/**
 * This code checks that NinjaTerm can handle custom baud rates.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2018-10-31
 * @last-modified 2018-10-31
 */

// the setup routine runs once when you press reset:
void setup() {
  // Initialize serial communication
  Serial.begin(27123);
}

void loop() {
  Serial.println("custom");
  // Wait until data is sent
  Serial.flush();
}



