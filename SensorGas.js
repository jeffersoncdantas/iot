#define TX2 17
#define RX2 16
#define DHT_PIN 15
#define DHTTYPE DHT22

#include <DHT.h>
#include <WiFi.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <PubSubClient.h>

// Definicoes e constantes
const char* SSID = "Wokwi-GUEST";
const char* PASSWORD = "";

const char* MQTT_BROKER_URL = "broker.hivemq.com";
const char* MQTT_CLIENT_NAME = "sensor_gas_client";
int BrokerPort = 1883;

String TopicoPrefixo = "grupo11"; // prefixo do topico
String TopicoGas = TopicoPrefixo + "/Gas"; // nome do topico para o gás

DHT dht(DHT_PIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

int BuzzerPin = 2;
int ledgreen = RX2;
int ledred = TX2;
int fan = 5;
bool perigo = false;
float lastHumidity = 0;

WiFiClient espClient;
PubSubClient client(espClient);

void setup_wifi() {
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
  pinMode(ledgreen, OUTPUT);
  pinMode(ledred, OUTPUT);
  pinMode(fan, OUTPUT);
  pinMode(BuzzerPin, OUTPUT);
  lcd.begin(16, 2);
  lcd.setCursor(1, 0);
  lcd.print("Detector de Gas");
  delay(1500);
  lcd.setCursor(0, 1);
  lcd.print("--------------------");
  delay(1000);
  lcd.clear();

  dht.begin();

  setup_wifi();
  client.setServer(MQTT_BROKER_URL, BrokerPort);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float humidity = dht.readHumidity();

  if (isnan(humidity)) {
    Serial.println("Erro ao ler o sensor DHT22.");
    return;
  }

  if (humidity != lastHumidity) {
    lcd.setCursor(0, 0);
    lcd.print("NIVEL= ");
    lcd.print(humidity);
    lcd.print(" %   ");
    lcd.setCursor(0, 1);

    if (humidity > 50 && !perigo) {
      perigo = true;
      digitalWrite(BuzzerPin, HIGH);
      digitalWrite(ledred, HIGH);
      digitalWrite(ledgreen, LOW);
      digitalWrite(fan, HIGH);
      lcd.print("PERIGO!!!  ");
    } else if (humidity <= 50 && perigo) {
      perigo = false;
      digitalWrite(BuzzerPin, LOW);
      digitalWrite(ledred, LOW);
      digitalWrite(ledgreen, HIGH);
      digitalWrite(fan, LOW);
      lcd.print("SEM PERIGO                      ");
    }

    lastHumidity = humidity;
    String payload = String(humidity);
    client.publish(TopicoGas.c_str(), payload.c_str());
  }

  delay(2000); 
}
