#include <Arduino.h>
#include <Timer.h>
void setup();
void loop();
void heart();
void temp();
#line 1 "src/sketch.ino"
//#include <Timer.h>
Timer t_heart;
Timer t_temp;

int boutonOFF = 4;
int relayPW = 2;
int etatButtonOFF;


void setup() {
  pinMode(boutonOFF, INPUT);
  pinMode(relayPW, OUTPUT);

  // activation du relais (mise sous tension de autoradio)
  digitalWrite(relayPW, LOW);

  t_heart.every(5000, heart);
  t_temp.every(5000, temp);
  
  Serial.begin(9600);
}

void loop() {

  t_heart.update();
  t_temp.update();

  etatButtonOFF = digitalRead(boutonOFF);

  Serial.println(etatButtonOFF);

  if (etatButtonOFF == HIGH) {

    // attente du delai d'appui sur le bouton OFF
    delay(2000);
    
    etatButtonOFF = digitalRead(boutonOFF);
    
    if (etatButtonOFF == HIGH) {

      // envoi de la commande d'arret au Raspberry
      Serial.println("HALT:arret");
  
      // attente de la fin de l'arrêt du Raspberry
      delay(30000);
      
      // arret du système
      digitalWrite(relayPW, HIGH);      
      
    }
  }  
}

void heart() {
  Serial.println("HEART:on");
}

void temp()
{
  unsigned int wADC;
  double t;

  // The internal temperature has to be used
  // with the internal reference of 1.1V.
  // Channel 8 can not be selected with
  // the analogRead function yet.

  // Set the internal reference and mux.
  ADMUX = (_BV(REFS1) | _BV(REFS0) | _BV(MUX3));
  ADCSRA |= _BV(ADEN);  // enable the ADC

  delay(20);            // wait for voltages to become stable.

  ADCSRA |= _BV(ADSC);  // Start the ADC

  // Detect end-of-conversion
  while (bit_is_set(ADCSRA,ADSC));

  // Reading register "ADCW" takes care of how to read ADCL and ADCH.
  wADC = ADCW;

  // The offset of 324.31 could be wrong. It is just an indication.
  t = (wADC - 324.31 ) / 1.22;

  // The returned temperature is in degrees Celsius.
  //return (t);
  Serial.println(t);
}
