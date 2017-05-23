import { Device, MqttConfig, DeviceDescription } from '@device-management/device-base';
import { Gpio } from 'onoff';
import { Observable } from 'rx';

export namespace DeviceManager {

    export class Engine extends Device {

        private readonly steps = [0b1000, 0b1100, 0b0100, 0b0110, 0b0010, 0b0011, 0b0001, 0b1001];
        private readonly stepsCount = 4095;
        private interval: any = null;
        private out1: Gpio;
        private out2: Gpio;
        private out3: Gpio;
        private out4: Gpio;

        constructor(
            mqttConfig: MqttConfig,
            deviceDescription: DeviceDescription,
            private engineConfig: EngineConfig) {
            super(mqttConfig, deviceDescription);
        }

        doStart(): Observable<any> {
            console.log("Starting engine controller...")
            this.out1 = new Gpio(this.engineConfig.pin1, "out");
            this.out2 = new Gpio(this.engineConfig.pin2, "out");
            this.out3 = new Gpio(this.engineConfig.pin3, "out");
            this.out4 = new Gpio(this.engineConfig.pin4, "out");
            let start = super.doStart();
            start.subscribe(() => { }, () => { }, () => {
                let topic = "devices/" + this.deviceDescription.deviceId + "/command";
                console.log("Subscribing topic: " + topic);
                this.mqttClient.subscribe(topic);
            });
            return start;
        };

        getMessageHandler(): (topic: string, message: string) => void {
            let self = this;
            return (topic, message) => {
                console.log("Recived message from mqtt. Topic: " + topic + ", Message: " + message);
                if (topic == "devices/" + self.deviceDescription.deviceId + "/command") {
                    var command = JSON.parse(message);
                    if (command.properties.hasOwnProperty("rotation")) {
                        self.rotate(command.properties.rotation, () => {
                            self.mqttClient.publish(
                                "devices/" + self.deviceDescription.deviceId + "/state",
                                JSON.stringify({
                                    deviceId: self.deviceDescription.deviceId,
                                    properties: {
                                        rotation: command.properties.rotation
                                    }
                                }),
                                {
                                    qos: 1,
                                    retain: true
                                });
                        }, () => { })
                    }
                }
            }
        }

        private rotate(rotation: number, success: () => void, error: () => void) {
            if (this.interval != null) {
                console.log("The rotation is in progress, so cannot rotate.");
                error();
                return;
            }
            let targetPosition = this.engineConfig.maxPosition * rotation / 100;
            let rotationsLeft = Math.abs(targetPosition - this.engineConfig.position);
            let cyclesLeft = Math.round(rotationsLeft * this.stepsCount);
            let isClockwise = targetPosition > this.engineConfig.position;
            let currentStep = 0;
            let stepProgress = isClockwise ? function () {
                currentStep++;
                if (currentStep > 7) {
                    currentStep = 0;
                }
            } : function () {
                currentStep--;
                if (currentStep < 0) {
                    currentStep = 7;
                }
            };
            let self = this;
            this.interval = setInterval(function () {
                if (cyclesLeft == 0) {
                    self.engineConfig.position = targetPosition;
                    clearInterval(self.interval);
                    self.interval = null;
                    success();
                    return;
                }
                self.performStep(currentStep);
                stepProgress();
                cyclesLeft--;
            }, 1);
        }

        private performStep(stepNumber: number) {
            let step = this.steps[stepNumber];
            this.out1.writeSync(step & 0b0001);
            this.out2.writeSync((step & 0b0010) >> 1);
            this.out3.writeSync((step & 0b0100) >> 2);
            this.out4.writeSync((step & 0b1000) >> 3);
        }

    }

    export interface EngineConfig {
        pin1: number;
        pin2: number;
        pin3: number;
        pin4: number;
        position: number;
        maxPosition: number;
    }

}