int boutonOFF = 4;
int relayPW = 2;
int etatButtonOFF;


void setup() {
  pinMode(boutonOFF, INPUT);
  pinMode(relayPW, OUTPUT);

  // activation du relais (mise sous tension de autoradio)
  digitalWrite(relayPW, LOW);
  
  Serial.begin(9600);
}

void loop() {

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