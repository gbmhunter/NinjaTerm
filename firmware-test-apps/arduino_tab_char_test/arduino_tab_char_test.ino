/**
 * Used to make sure NinjaTerm can display tab chars correctly.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2018-11-05
 * @last-modified 2018-11-05
 */

void setup() {
  // Initialize serial communication
  Serial.begin(9600);
}

void loop() {
  Serial.println("tab\ttab\ttab\ttab");
  delay(2000);
}



