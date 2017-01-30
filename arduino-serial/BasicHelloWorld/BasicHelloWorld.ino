/**
 * Basic code that outputs "Hello, World!".
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-07-10
 * @last-modified 2017-01-29
 */

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

void loop() {
  Serial.println("Hello, world!");
  delay(5);
}



