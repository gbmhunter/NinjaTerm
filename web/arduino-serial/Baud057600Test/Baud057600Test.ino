/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-22
 * @last-modified 2017-01-30
 */

void setup() {
  // Initialize serial communication at 115200 bits per second
  Serial.begin(57600);
}

void loop() {

  Serial.println("fast ");
  // Wait until data is sent
  Serial.flush();
}



