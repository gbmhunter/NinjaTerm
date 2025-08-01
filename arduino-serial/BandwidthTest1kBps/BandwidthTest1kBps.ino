/**
 * Code that tests the bandwidth capabilities of NinjaTerm.
 * Allows user to select transmission rate: 1kBps, 10kBps, or 50kBps.
 * Always sends data every 1ms, adjusting the number of characters per transmission.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-11-22
 * @last-modified 2025-08-01
 */

char currentChar = 'A';
unsigned long lastSendTime = 0;
const unsigned long SEND_INTERVAL_MICROS = 1000; // 1ms = 1000 microseconds
int charsPerTransmission = 1; // Number of characters to send each time
bool rateSelected = false;

void setup() {
  Serial.begin(115200);
  Serial.println("NinjaTerm Bandwidth Test");
  Serial.println("Select transmission rate:");
  Serial.println("1. 1kBps (1 char per ms)");
  Serial.println("2. 10kBps (10 chars per ms)");
  Serial.println("3. 50kBps (50 chars per ms)");
  Serial.println("Enter your choice (1, 2, or 3):");
  
  // Wait for user input
  while (!rateSelected) {
    if (Serial.available() > 0) {
      char choice = Serial.read();
      
      switch (choice) {
        case '1':
          charsPerTransmission = 1;
          Serial.println("Selected: 1kBps (1 char per ms)");
          rateSelected = true;
          break;
        case '2':
          charsPerTransmission = 10;
          Serial.println("Selected: 10kBps (10 chars per ms)");
          rateSelected = true;
          break;
        case '3':
          charsPerTransmission = 50;
          Serial.println("Selected: 50kBps (50 chars per ms)");
          rateSelected = true;
          break;
        default:
          Serial.println("Invalid choice. Enter 1, 2, or 3:");
          break;
      }
    }
  }
  
  Serial.println("Starting transmission...");
  Serial.println("Cycling through alphabet");
  lastSendTime = micros();
}

void loop() {
  unsigned long currentTime = micros();

  // Check if it's time to send the next batch of characters
  if (currentTime - lastSendTime >= SEND_INTERVAL_MICROS) {
    // Send the specified number of characters
    for (int i = 0; i < charsPerTransmission; i++) {
      Serial.print(currentChar);

      // Move to next character in alphabet
      currentChar++;
      if (currentChar > 'Z') {
        currentChar = 'A';
      }
    }

    // Update timing for next iteration
    lastSendTime = currentTime;
  }
}
