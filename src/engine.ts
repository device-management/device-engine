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

        doStart(): Observable<any> {
            console.log("Starting engine controller...")
            this.out1 = new Gpio(this.device.configuration.pin1, "out");
            this.out2 = new Gpio(this.device.configuration.pin2, "out");
            this.out3 = new Gpio(this.device.configuration.pin3, "out");
            this.out4 = new Gpio(this.device.configuration.pin4, "out");
            let start = super.doStart();
            start.subscribe(() => { }, () => { }, () => {
                let topic = "devices/" + this.device.id + "/command";
                console.log("Subscribing topic: " + topic);
                this.mqttClient.subscribe(topic);
            });
            return start;
        };

        getMessageHandler(): (topic: string, message: string) => void {
            let self = this;
            return (topic, message) => {
                console.log("Recived message from mqtt. Topic: " + topic + ", Message: " + message);
                if (topic == "devices/" + self.device.id + "/command") {
                    var command = JSON.parse(message);
                    if (command.state.hasOwnProperty("rotation")) {
                        self.rotate(command.state.rotation, () => {
                            self.mqttClient.publish(
                                "devices/" + self.device.id + "/state",
                                JSON.stringify({
                                    id: self.device.id,
                                    state: {
                                        rotation: command.state.rotation
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
            let targetPosition = this.device.configuration.maxPosition * rotation / 100;
            let rotationsLeft = Math.abs(targetPosition - this.device.configuration.position);
            let cyclesLeft = Math.round(rotationsLeft * this.stepsCount);
            let isClockwise = targetPosition > this.device.configuration.position;
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
                    self.device.configuration.position = targetPosition;
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

}