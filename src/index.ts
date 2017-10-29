import { DeviceManager } from "./engine";

let mqttAddress = process.env.MQTT_ADDRESS ? process.env.MQTT_ADDRESS : "mqtt://mqtt";
let deviceId = process.env.DEVICE_ID ? process.env.DEVICE_ID : "ENG01";
let deviceType = process.env.DEVICE_TYPE ? process.env.DEVICE_TYPE : "motor";
let deviceName = process.env.DEVICE_NAME ? process.env.DEVICE_NAME : "Engine controller";
let pin1Number = process.env.PIN1 ? parseInt(process.env.PIN1) : 19;
let pin2Number = process.env.PIN2 ? parseInt(process.env.PIN2) : 13;
let pin3Number = process.env.PIN3 ? parseInt(process.env.PIN3) : 6;
let pin4Number = process.env.PIN4 ? parseInt(process.env.PIN4) : 5;

let engine = new DeviceManager.Engine(
    {
        brokerAddress: mqttAddress
    },
    {
        deviceId: deviceId,
        deviceName: deviceName,
        deviceType: deviceType,
        deviceConfiguration: {
            pin1: pin1Number,
            pin2: pin2Number,
            pin3: pin3Number,
            pin4: pin4Number,
            position: 0,
            maxPosition: 22,
        },
        deviceState: {
            rotation: 0,
            isOnline: true
        }
    }
);

console.log("MQTT address: " + mqttAddress);
console.log("Device ID: " + deviceId);
console.log("Device type: " + deviceType);
console.log("Pin 1: " + pin1Number);
console.log("Pin 2: " + pin2Number);
console.log("Pin 3: " + pin3Number);
console.log("Pin 4: " + pin4Number);
console.log("Starting engine...");

engine.start();