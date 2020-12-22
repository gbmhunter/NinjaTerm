/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-22
 * @last-modified 2016-11-22
 */

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

void loop() {

#define DISPLAY_PERIOD (100)

  Serial.print("\x1B[31mtest1");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[32mtest2");
  delay(DISPLAY_PERIOD);

}



