import { expect } from "chai";
import { delay } from "@httptoolkit/util";

import { UsbmuxClient, getUsbmuxClient } from "../src/index";

describe("Usbmux-client integration tests", () => {

    let client: UsbmuxClient | undefined;

    afterEach(() => {
        client?.close();
        client = undefined;
    });

    if (process.env.CI) {
        it("can query the connected devices (seeing no results)", async () => {
            client = await getUsbmuxClient();
            await delay(10); // Not clear this is necessary, but not unhelpful

            const devices = client.getDevices();

            // Tests assume no devices in CI but this at least confirms we can connect
            // to Usbmux successfully.
            expect(devices).to.deep.equal({});
        });
    } else {
        it("can detect the connected device", async () => {
            client = await getUsbmuxClient();
            await delay(10); // Not clear this is necessary, but not unhelpful

            const devices = client.getDevices();

            // Local integratiion testing assumes you'll test with a real device
            expect(devices).to.be.an('object');
            expect(Object.keys(devices).length).to.be.greaterThan(0,
                "Local integration testing assumes at least one iOS device connected"
            );

            const deviceId = Object.keys(devices)[0];
            expect(devices[deviceId]).to.be.an('object');
            expect(devices[deviceId].DeviceID).to.equal(parseInt(deviceId));
            expect(devices[deviceId].ConnectionType).to.equal('USB');
            expect(devices[deviceId].SerialNumber).to.be.a('string');
            expect((devices[deviceId].SerialNumber as any).length).to.equal(40);
        });
    }

});