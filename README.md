# device-engine
The software for step motor control.

```sh
docker run \
-e "MQTT_ADDRESS=mqtt://192.168.0.49" \
-e "PIN1=19" \
-e "PIN2=13" \
-e "PIN3=6" \
-e "PIN4=5" \
-e "DEVICE_ID=ENG01" \
-e "DEVICE_NAME=Engine controller" \
--privileged -d devicemanagment/device-engine
```
