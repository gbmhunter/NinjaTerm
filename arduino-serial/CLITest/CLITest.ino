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

/*
[1B][8D[1B][J-- [00:10:53.854,217] [1B][0m<inf> Bsp: Toggle all leds[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J-- [00:10:54.054,290] [1B][0m<inf> Bsp: Toggle all leds[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J-- [00:10:54.254,394] [1B][0m<inf> Bsp: Toggle all leds[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J-- [00:10:54.254,425] [1B][0m<inf> Main: Tick[1B][0m
[1B][1;32muart:~$ [1B][m[1B][8D[1B][J[1B][1;32muart:~$ [1B][m
*/

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



