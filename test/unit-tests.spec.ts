import * as stream from 'stream';
import * as net from 'net';

import { expect } from 'chai';
import { makeDestroyable } from "destroyable-server";

import { UsbmuxClient } from "../src/index";
import { readBytes } from '../src/stream-utils';
import { delay } from '@httptoolkit/util';

// Various Base64 encoded messages we expect or use as test data:
const MESSAGES = {
    LISTEN_REQUEST: "hwEAAAAAAAAIAAAAAQAAADw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04Ij8+CjwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgIi0vL0FwcGxlLy9EVEQgUExJU1QgMS4wLy9FTiIgImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGQiPgo8cGxpc3QgdmVyc2lvbj0iMS4wIj4KICA8ZGljdD4KICAgIDxrZXk+TWVzc2FnZVR5cGU8L2tleT4KICAgIDxzdHJpbmc+TGlzdGVuPC9zdHJpbmc+CiAgICA8a2V5PkNsaWVudFZlcnNpb25TdHJpbmc8L2tleT4KICAgIDxzdHJpbmc+dXNibXV4LWNsaWVudDwvc3RyaW5nPgogICAgPGtleT5Qcm9nTmFtZTwva2V5PgogICAgPHN0cmluZz51c2JtdXgtY2xpZW50PC9zdHJpbmc+CiAgPC9kaWN0Pgo8L3BsaXN0Pg==",
    OK_RESULT: "JgEAAAEAAAAIAAAAAQAAADw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04Ij8+CjwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgIi0vL0FwcGxlLy9EVEQgUExJU1QgMS4wLy9FTiIgImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGQiPgo8cGxpc3QgdmVyc2lvbj0iMS4wIj4KPGRpY3Q+Cgk8a2V5Pk1lc3NhZ2VUeXBlPC9rZXk+Cgk8c3RyaW5nPlJlc3VsdDwvc3RyaW5nPgoJPGtleT5OdW1iZXI8L2tleT4KCTxpbnRlZ2VyPjA8L2ludGVnZXI+CjwvZGljdD4KPC9wbGlzdD4K", // Result = 0 plist message
    FAIL_RESULT: "JgEAAAEAAAAIAAAAAQAAADw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04Ij8+CjwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgIi0vL0FwcGxlLy9EVEQgUExJU1QgMS4wLy9FTiIgImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGQiPgo8cGxpc3QgdmVyc2lvbj0iMS4wIj4KPGRpY3Q+Cgk8a2V5Pk1lc3NhZ2VUeXBlPC9rZXk+Cgk8c3RyaW5nPlJlc3VsdDwvc3RyaW5nPgoJPGtleT5OdW1iZXI8L2tleT4KCTxpbnRlZ2VyPjE8L2ludGVnZXI+CjwvZGljdD4KPC9wbGlzdD4K", // Result = 1 plist message
    DEVICE_ATTACHED_EVENT: "qQIAAAEAAAAIAAAAAAAAADw/eG1sIHZlcnNpb249IjEuMCIgZW5jb2Rpbmc9IlVURi04Ij8+CjwhRE9DVFlQRSBwbGlzdCBQVUJMSUMgIi0vL0FwcGxlLy9EVEQgUExJU1QgMS4wLy9FTiIgImh0dHA6Ly93d3cuYXBwbGUuY29tL0RURHMvUHJvcGVydHlMaXN0LTEuMC5kdGQiPgo8cGxpc3QgdmVyc2lvbj0iMS4wIj4KPGRpY3Q+Cgk8a2V5Pk1lc3NhZ2VUeXBlPC9rZXk+Cgk8c3RyaW5nPkF0dGFjaGVkPC9zdHJpbmc+Cgk8a2V5PkRldmljZUlEPC9rZXk+Cgk8aW50ZWdlcj4xPC9pbnRlZ2VyPgoJPGtleT5Qcm9wZXJ0aWVzPC9rZXk+Cgk8ZGljdD4KCQk8a2V5PkNvbm5lY3Rpb25TcGVlZDwva2V5PgoJCTxpbnRlZ2VyPjQ4MDAwMDAwMDwvaW50ZWdlcj4KCQk8a2V5PkNvbm5lY3Rpb25UeXBlPC9rZXk+CgkJPHN0cmluZz5VU0I8L3N0cmluZz4KCQk8a2V5PkRldmljZUlEPC9rZXk+CgkJPGludGVnZXI+MTwvaW50ZWdlcj4KCQk8a2V5PkxvY2F0aW9uSUQ8L2tleT4KCQk8aW50ZWdlcj45OTk5OTk8L2ludGVnZXI+CgkJPGtleT5Qcm9kdWN0SUQ8L2tleT4KCQk8aW50ZWdlcj40Nzc2PC9pbnRlZ2VyPgoJCTxrZXk+U2VyaWFsTnVtYmVyPC9rZXk+CgkJPHN0cmluZz5BQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBQUFBPC9zdHJpbmc+Cgk8L2RpY3Q+CjwvZGljdD4KPC9wbGlzdD4K",
};

async function expectMessage(input: stream.Readable, messageKey: keyof typeof MESSAGES) {
    const expectedMessage = Buffer.from(MESSAGES[messageKey], 'base64');
    const bytesToRead = expectedMessage.byteLength;

    const data = await readBytes(input, bytesToRead);
    expect(data).to.deep.equal(expectedMessage);
}

describe("Usbmux-client unit tests", () => {

    let serverSocket: net.Socket | undefined;

    const waitForSocket = () => new Promise<net.Socket>(async (resolve) => {
        while (true) {
            if (serverSocket) {
                resolve(serverSocket);
                return;
            }
            await delay(5);
        }
    });

    const mockServer = makeDestroyable(net.createServer((socket) => {
        if (serverSocket) serverSocket.destroy();

        serverSocket = socket;

        serverSocket.on('close', () => {
            if (serverSocket === socket) {
                serverSocket = undefined;
            }
        })
    }));
    let mockServerPort: number | undefined;
    const startServer = async (port = 0) => {
        mockServer.listen(port);
        await new Promise((resolve, reject) => {
            mockServer.once('listening', resolve);
            mockServer.once('error', reject);
        });
        mockServerPort = (mockServer.address() as net.AddressInfo).port;
    }

    let client: UsbmuxClient | undefined;

    beforeEach(async () => {
        await startServer();
    });

    afterEach(async () => {
        client?.close();
        client = undefined;

        await mockServer.destroy();
        serverSocket = undefined;
    });

    it("should connect & report no connected devices initially", async () => {
        client = new UsbmuxClient({ port: mockServerPort! });
        const socket = await waitForSocket();

        await expectMessage(socket, 'LISTEN_REQUEST');
        socket.write(Buffer.from(MESSAGES.OK_RESULT, 'base64'));
;
        const devices = await client.getDevices();
        expect(Object.keys(devices)).to.have.length(0);
    });

    it("should connect & report a connected device after one appears", async () => {
        client = new UsbmuxClient({ port: mockServerPort! });
        const socket = await waitForSocket();

        await expectMessage(socket, 'LISTEN_REQUEST');
        socket.write(Buffer.from(MESSAGES.OK_RESULT, 'base64'));

        expect(Object.keys(await client.getDevices())).to.have.length(0);

        socket.write(Buffer.from(MESSAGES.DEVICE_ATTACHED_EVENT, 'base64'));
        await delay(10);
        expect(Object.keys(await client.getDevices())).to.have.length(1);
    });

    it("should handle reconnecting after disconnection", async () => {
        client = new UsbmuxClient({ port: mockServerPort! });
        let socket = await waitForSocket();

        await expectMessage(socket, 'LISTEN_REQUEST');
        socket.write(Buffer.from(MESSAGES.OK_RESULT, 'base64'));

        expect(Object.keys(await client.getDevices())).to.have.length(0);

        socket.destroy();
        serverSocket = undefined;
        await delay(10);

        const deviceQuery = client.getDevices();

        socket = await waitForSocket();
        await expectMessage(socket, 'LISTEN_REQUEST');
        socket.write(Buffer.from(MESSAGES.OK_RESULT, 'base64'));
        socket.write(Buffer.from(MESSAGES.DEVICE_ATTACHED_EVENT, 'base64'));

        expect(Object.keys(await deviceQuery)).to.have.length(1);
    });

    it("should handle reconnecting to an initially unresponsive server", async () => {
        const port = mockServerPort!;
        await mockServer.destroy();

        client = new UsbmuxClient({ port });

        const deviceQueryResult = await client.getDevices().catch(e => e);;
        expect(deviceQueryResult).to.be.instanceOf(Error);
        expect(deviceQueryResult.message).to.contain("ECONNREFUSED");

        await startServer(port);

        const deviceQuery = client.getDevices();

        const socket = await waitForSocket();
        await expectMessage(socket, 'LISTEN_REQUEST');
        socket.write(Buffer.from(MESSAGES.OK_RESULT, 'base64'));
        socket.write(Buffer.from(MESSAGES.DEVICE_ATTACHED_EVENT, 'base64'));

        expect(Object.keys(await deviceQuery)).to.have.length(1);
    });

});