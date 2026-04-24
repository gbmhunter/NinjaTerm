/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-22
 */

#define DISPLAY_PERIOD_MS (100)

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
}

void loop() {
  // char * msg = "0123456789";
  char * msg = "hhhhhhhhhhhhhf fhfhfhf jjjjjjjsdkcdsksdkds dsjjjjjjjjjjjjfkfkfkf sdjjjjjjjjjjjjjjjjjjjjjjjjjjjjj ddkdkdkfjfjfjfjfssksksksk";
  for (uint8_t i = 0; i <= strlen(msg) - 1; i++) {
    Serial.print(msg[i]);
    delay(DISPLAY_PERIOD_MS);
  }
}
