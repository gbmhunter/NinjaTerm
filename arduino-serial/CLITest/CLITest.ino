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
  Serial.begin(115200);
}

void loop() {

  if (Serial.available()) {
    uint8_t rxChar = Serial.read();
    switch(rxChar) {
      case '1':
        Serial.write("Hello");
        break;
    }
  }

}



