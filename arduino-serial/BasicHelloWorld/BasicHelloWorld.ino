/**
 * Basic code that outputs "Hello, World!" ten times a second.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-07-10
 * @last-modified 2016-09-27
 */

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

// the loop routine runs over and over again forever:
void loop() {
  Serial.println("Hello, world!");
  delay(100);        // delay in between reads for stability
}



