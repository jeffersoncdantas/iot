//Jefferson da Conceição Dantas | RA 10401327
//Leonardo Medeiros Silva Aparicio | RA: 10401388
//Marina Miki Sinzato | RA: 10401880
//Zhuyu Su | RA 10400811


#include <DHT.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <PubSubClient.h>

#define TX2 17
#define RX2 16
#define DHT_PIN 15
#define DHTTYPE DHT22

const char* SSID = "Wokwi-GUEST";
const char* PASSWORD = "";

const char* MQTT_BROKER_URL = "broker.hivemq.com";
const char* MQTT_CLIENT_NAME = "sensor_umidade_solo_client";
int BrokerPort = 1883;

String TopicoPrefixo = "grupo11";
String Topico_UmidadeSolo = TopicoPrefixo + "/UmidadeSolo";

WiFiClient espClient;
PubSubClient client(espClient);
int ledirrigador = TX2;

DHT dht(DHT_PIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

bool irrigador = false;
float lastHumidity = -1; // Valor inicial fora do range esperado
unsigned long lastMsg = 0;
const long interval = 2000; // Intervalo de 2 segundos

void setup_wifi() {
  delay(10);
  WiFi.begin(SSID, PASSWORD);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("WiFi connected");
}

void reconnect() {
  while (!client.connected()) {
    if (client.connect(MQTT_CLIENT_NAME)) {
      Serial.println("MQTT connected");
    } else {
      delay(5000);
    }
  }
}

void setup() {
  Serial.begin(115200);
  lcd.init();
  lcd.backlight();
  pinMode(ledirrigador, OUTPUT);
  lcd.begin(16, 2);
  lcd.setCursor(1, 0);
  lcd.print("Umidade do Solo");
  delay(1500);
  lcd.setCursor(0, 1);
  lcd.print("--------------------");
  delay(1000);
  lcd.clear();

  setup_wifi();
  client.setServer(MQTT_BROKER_URL, BrokerPort);

  dht.begin();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  unsigned long now = millis();
  if (now - lastMsg > interval) {
    lastMsg = now;

    float humidity = dht.readHumidity();
    if (isnan(humidity)) {
      Serial.println("Erro ao ler o sensor DHT22.");
      return;
    }

    if (humidity != lastHumidity) {
      lastHumidity = humidity;

      lcd.setCursor(0, 0);
      lcd.print("Umidade: ");
      lcd.print(humidity);
      lcd.print(" %   ");
      lcd.setCursor(0, 1);

      if (humidity < 10.0) {
        irrigador = true;
        digitalWrite(ledirrigador, HIGH);
        lcd.print("Ligando irrigador.     Solo muito seco!");
      } else if (humidity >= 10.0 && humidity <= 17.0) {
        irrigador = false;
        digitalWrite(ledirrigador, LOW);
        lcd.print("Umidade moderada");
      } else if (humidity > 17.0) {
        irrigador = false;
        digitalWrite(ledirrigador, LOW);
        lcd.print("Solo Umido!                        ");
      }

      String payload = String(humidity);
      client.publish(Topico_UmidadeSolo.c_str(), payload.c_str());
    }
  }
}

