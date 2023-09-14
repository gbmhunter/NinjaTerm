/**
 * Basic code that tests the colour capabilities of NinjaTerm.
 *
 * @author Geoffrey Hunter <gbmhunter@gmail.com> (www.mbedded.ninja)
 * @since 2016-09-27
 */

#define DISPLAY_PERIOD (200)

// the setup routine runs once when you press reset:
void setup() {
  // initialize serial communication at 9600 bits per second:
  Serial.begin(115200);
}

void loop() {

  // Reset all styles
  Serial.print("\x1B[0m");
  
  Serial.print("\x1B[30mnormal black");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[31mnormal red");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[32mnormal green");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[33mnormal brown/yellow");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[34mnormal blue");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[35mnormal magenta");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[36mnormal cyan");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[37mnormal grey");
  delay(DISPLAY_PERIOD);

  // Set to "bright" mode
  Serial.print("\x1B[1m");

  Serial.print("\x1B[30mbright black");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[31mbright red");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[32mbright green");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[33mbright brown/yellow");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[34mbright blue");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[35mbright magenta");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[36mbright cyan");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[37mbright grey");
  delay(DISPLAY_PERIOD);

  // BACKGROUNDS
  //============

  // Reset all styles
  Serial.print("\x1B[0m");

  Serial.print("\x1B[40mblack bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[41mred bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[42mgreen bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[43myellow bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[44mblue bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[45mmagneta bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[46mcyan bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[47mwhite bg");
  delay(DISPLAY_PERIOD);

  // Set to "bright" mode
  Serial.print("\x1B[1m");

  // For some of the following the text colour is also
  // changes so you can actually read it against
  // the background
  Serial.print("\x1B[40mbright black bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[41;30mbright red bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[42;30mbright green bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[43;30mbright yellow bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[44;37mbright blue bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[45mbright magneta bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[46mbright cyan bg");
  delay(DISPLAY_PERIOD);
  Serial.print("\x1B[47;30mbright white bg");
  delay(DISPLAY_PERIOD);

}



