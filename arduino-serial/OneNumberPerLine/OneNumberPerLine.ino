/**
 * Basic code that outputs "Hello, World!" ten times a second.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-10-25
 * @last-modified 2016-10-25
 */

void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
}

// the loop routine runs over and over again forever:
void loop() {
  
#define DELAY_TIME_MS (300)
  
  Serial.println("0");
  delay(DELAY_TIME_MS);
  Serial.println("1");
  delay(DELAY_TIME_MS);
  Serial.println("2");
  delay(DELAY_TIME_MS);
  Serial.println("3");
  delay(DELAY_TIME_MS);
  Serial.println("4");
  delay(DELAY_TIME_MS);
  Serial.println("5");
  delay(DELAY_TIME_MS);
  Serial.println("6");
  delay(DELAY_TIME_MS);
  Serial.println("7");
  delay(DELAY_TIME_MS);
  Serial.println("8");
  delay(DELAY_TIME_MS);
  Serial.println("9");
  delay(DELAY_TIME_MS);
}



