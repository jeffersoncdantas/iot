

//Jefferson da Conceição Dantas | RA 10401327
//Leonardo Medeiros Silva Aparicio | RA: 10401388
//Marina Miki Sinzato | RA: 10401880
//Zhuyu Su | RA 10400811

#include <DHT.h>
#include <LiquidCrystal_I2C.h>
#include <WiFi.h>
#include <PubSubClient.h>

#define DHT_PIN 15
#define DHTTYPE DHT22

const char* SSID = "Wokwi-GUEST";
const char* PASSWORD = "";

const char* MQTT_BROKER_URL = "broker.hivemq.com";
const char* MQTT_CLIENT_NAME = "sensor_temp_umidade_ar_client";
int BrokerPort = 1883;

String TopicoPrefixo = "grupo11";
String Topico_Temperatura = TopicoPrefixo + "/Temperatura";
String Topico_UmidadeAr = TopicoPrefixo + "/UmidadeAr";

WiFiClient espClient;
PubSubClient client(espClient);

DHT dht(DHT_PIN, DHTTYPE);
LiquidCrystal_I2C lcd(0x27, 16, 2);

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
  dht.begin();
  lcd.init();
  lcd.backlight();
  lcd.setCursor(0, 0);
  lcd.print("Temp:    C");
  lcd.setCursor(0, 1);
  lcd.print("Umidade:   %");

  setup_wifi();
  client.setServer(MQTT_BROKER_URL, BrokerPort);
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  float temperature = dht.readTemperature();
  float humidity = dht.readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    Serial.println("Erro ao ler o sensor DHT22.");
    return;
  }

  lcd.clear();
  lcd.setCursor(0, 0);
  lcd.print("Temp: ");
  lcd.print(temperature);
  lcd.print(" C");

  lcd.setCursor(0, 1);
  lcd.print("Umidade: ");
  lcd.print(humidity);
  lcd.print(" %");

  String payloadTemp = String(temperature);
  String payloadUmidade = String(humidity);
  client.publish(Topico_Temperatura.c_str(), payloadTemp.c_str());
  client.publish(Topico_UmidadeAr.c_str(), payloadUmidade.c_str());

  delay(5000);
}
