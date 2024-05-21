import * as net from 'net';

import { expect } from 'chai';
import { makeDestroyable } from "destroyable-server";

import { UsbmuxClient, getUsbmuxClient } from "../src/index";
import { delay } from '@httptoolkit/util';

// Various Base64 encoded messages we expect or use a test data:
const MESSAGES = {
    LISTEN_REQUEST: Buffer.from("hwEAAAAAAAAIAAAAAQAAADw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04Ij8+CjwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgIi0vL0FwcGxlLy9EVEQgUExJU1QgMS4wLy9FTiIgImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGQiPgo8cGxpc3QgdmVyc2lvbj0iMS4wIj4KICA8ZGljdD4KICAgIDxrZXk+TWVzc2FnZVR5cGU8L2tleT4KICAgIDxzdHJpbmc+TGlzdGVuPC9zdHJpbmc+CiAgICA8a2V5PkNsaWVudFZlcnNpb25TdHJpbmc8L2tleT4KICAgIDxzdHJpbmc+dXNibXV4LWNsaWVudDwvc3RyaW5nPgogICAgPGtleT5Qcm9nTmFtZTwva2V5PgogICAgPHN0cmluZz51c2JtdXgtY2xpZW50PC9zdHJpbmc+CiAgPC9kaWN0Pgo8L3BsaXN0Pg==", "base64")
};

describe("Usbmux-client unit tests", () => {

    let serverSocket: net.Socket | undefined;

    const mockServer = makeDestroyable(net.createServer((socket) => {
        if (serverSocket) serverSocket.destroy();
        serverSocket = socket;
    }));
    let mockServerPort: number | undefined;

    let client: UsbmuxClient | undefined;

    beforeEach(async () => {
        mockServer.listen(0);
        mockServerPort = (mockServer.address() as net.AddressInfo).port;
    });

    afterEach(async () => {
        client?.close();
        client = undefined;

        await mockServer.destroy();
        serverSocket = undefined;
    });

    it.only("should send a hello message to start listening", async () => {
        getUsbmuxClient({ port: mockServerPort! });

        await delay(10);
        const receivedData = serverSocket!.read();
        
        expect(receivedData).to.deep.equal(MESSAGES.LISTEN_REQUEST);
    });

});