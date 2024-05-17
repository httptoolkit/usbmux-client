import { expect } from "chai";
import { delay } from "@httptoolkit/util";

import { UsbmuxClient, getUsbmuxClient } from "../src/index";

describe("Usbmux-client", () => {

    let client: UsbmuxClient | undefined;

    afterEach(() => {
        client?.close();
        client = undefined;
    })

    it("can expose the connected devices ", async () => {
        client = await getUsbmuxClient();
        await delay(10); // Not clear this is necessary, but not unhelpful

        const devices = client.getDevices();

        // Tests assume no devices (since this will always be the state in
        // the CI environment) but this at least confirms we can connect
        // to Usbmux successfully.
        expect(devices).to.deep.equal({});
    });

});