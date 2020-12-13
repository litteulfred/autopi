#include <Timer.h>
// Timer t_heart;
// Timer t_temp;
Timer t_btn;

int boutonOFF = 4;
int boutonVOL = 5;
int relayPW = 2;
int etatButtonOFF;
int etatButtonVOL;

void setup() {
  pinMode(boutonOFF, INPUT);
  pinMode(relayPW, OUTPUT);

  // activation du relais (mise sous tension de autoradio)
  digitalWrite(relayPW, LOW);

//  t_heart.every(5000, heart);
//  t_temp.every(5000, temp);
  t_btn.every(1000, btnONOFF);
  
  Serial.begin(9600);
}

void loop() {

//  t_heart.update();
//  t_temp.update();
  t_btn.update();
  btnVOL();
  
//  Serial.println("VOL:on");
  
}

void btnONOFF() {

  etatButtonOFF = digitalRead(boutonOFF);

//  Serial.println(etatButtonOFF);

  if (etatButtonOFF == HIGH) {

      // envoi de la commande d'arret au Raspberry
      Serial.println("HALT:arret");
  
      // attente de la fin de l'arrêt du Raspberry
      delay(10000);
      
      // arret du système
      digitalWrite(relayPW, HIGH);      

  }  
}

void btnVOL() {

  etatButtonVOL = digitalRead(boutonVOL);
  
//  Serial.println("VOL:off");

//  Serial.println(etatButtonVOL);

  if (etatButtonVOL == HIGH) {

      // envoi de la commande d'arret au Raspberry
      Serial.println("VOL:on");
  
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
