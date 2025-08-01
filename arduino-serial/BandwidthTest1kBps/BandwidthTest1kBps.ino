/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 * Outputs approximately 1kBps of ASCII data cycling through the alphabet.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-22
 * @last-modified 2025-08-01
 */

char currentChar = 'A';
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL_MICROS = 1000; // 1ms = 1000 microseconds

void setup() {
  Serial.begin(115200);
  Serial.println("Starting 1kBps bandwidth test...");
  Serial.println("Cycling through alphabet at ~1000 bytes per second");
  lastSendTime = micros();
}

void loop() {
  unsigned long currentTime = micros();

  // Check if it's time to send the next character
  if (currentTime - lastSendTime >= SEND_INTERVAL_MICROS) {
    // Send character (1 byte)
    Serial.print(currentChar);

    // Move to next character in alphabet
    currentChar++;
    if (currentChar > 'Z') {
      currentChar = 'A';
    }

    // Update timing for next iteration
    lastSendTime = currentTime;
  }
}
