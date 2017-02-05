/**
 * Code that just prints new lines.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2017-01-29
 * @last-modified 2017-01-29
 */

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
}

void loop() {
  Serial.println("");
  // Wait until data is sent
  Serial.flush();
}



