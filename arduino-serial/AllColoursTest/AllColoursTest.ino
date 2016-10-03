/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 * @last-modified 2016-09-27
 */

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(9600);
}

void loop() {

#define DISPLAY_PERIOD (100)
  
  Serial.println("\x1B[30mnormal black");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[31mnormal red");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[32mnormal green");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[33mnormal brown/yellow");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[34mnormal blue");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[35mnormal magenta");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[36mnormal cyan");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[37mnormal grey");
  delay(DISPLAY_PERIOD);

  Serial.println("\x1B[30;1mbold black");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[31;1mbold red");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[32;1mbold green");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[33;1mbold brown/yellow");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[34;1mbold blue");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[35;1mbold magenta");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[36;1mbold cyan");
  delay(DISPLAY_PERIOD);
  Serial.println("\x1B[37;1mbold grey");
  delay(DISPLAY_PERIOD);
}



