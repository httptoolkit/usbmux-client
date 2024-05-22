import * as net from 'net';
import * as plist from 'plist';
import { delay, getDeferred } from '@httptoolkit/util';

import { readBytes } from './stream-utils';

const DEFAULT_ADDRESS = process.platform === 'win32'
    ? { port: 27015 }
    : { path: '/var/run/usbmuxd' };

function plistSerialize(value: any) {
    const plistString = plist.build(value)
    const plistBuffer = Buffer.from(plistString, 'utf8');

    const length = 16 + plistBuffer.byteLength; // Header always 16 bytes
    const version = 0; // Also called 'reserved'? Always 0
    const messageType = 8; // 8 is 'plist' message type
    const tag = 1; // Echoed in responses, not used for now

    const messageHeader = Buffer.alloc(16);
    messageHeader.writeUInt32LE(length, 0);
    messageHeader.writeUInt32LE(version, 4);
    messageHeader.writeUInt32LE(messageType, 8);
    messageHeader.writeUInt32LE(tag, 12);

    return Buffer.concat([messageHeader, plistBuffer], length);
}

type ResultMessage = { MessageType: 'Result', Number: number };
type AttachedMessage = { MessageType: 'Attached', DeviceID: number, Properties: Record<string, string | number> };
type DetachedMessage = { MessageType: 'Detached', DeviceID: number };

type ResponseMessage =
    | ResultMessage
    | AttachedMessage
    | DetachedMessage;


const readMessageFromStream = async (stream: net.Socket): Promise<ResponseMessage | null> => {
    if (stream.closed) return null;

    const header = await readBytes(stream, 16);

    const payloadLength = header.readUInt32LE(0) - 16; // Minus the header length
    const payload = await readBytes(stream, payloadLength);

    return plist.parse(payload.toString('utf8')) as ResponseMessage;
}

const connectSocket = async (options: net.NetConnectOpts) => {
    const conn = net.connect(options);

    await new Promise((resolve, reject) => {
        conn.once('connect', resolve);
        conn.once('error', reject);
    });

    return conn;
}

export class UsbmuxClient {

    constructor(
        private connectionOptions: net.NetConnectOpts = DEFAULT_ADDRESS
    ) {
        this.startListeningForDevices().catch(() => {});
    }

    deviceMonitorConnection: net.Socket | Promise<net.Socket> | undefined;

    private async startListeningForDevices() {
        if (this.deviceMonitorConnection instanceof net.Socket) return;
        else if (this.deviceMonitorConnection?.then) return this.deviceMonitorConnection;

        const connectionDeferred = getDeferred<net.Socket>();
        this.deviceMonitorConnection = connectionDeferred.promise;

        try {
            const conn = await connectSocket(this.connectionOptions);

            // Start listening for connected devices:
            conn.write(plistSerialize({
                MessageType: 'Listen',
                ClientVersionString: 'usbmux-client',
                ProgName: 'usbmux-client'
            }));

            const response = await readMessageFromStream(conn);
            if (
                response === null ||
                response.MessageType !== 'Result' ||
                response.Number !== 0
            ) {
                throw new Error('Usbmux connection failed');
            };

            this.listenToMessages(conn);
            await delay(10); // Brief delay to make sure we get already-connected device updates

            connectionDeferred.resolve(conn);
            this.deviceMonitorConnection = conn;
            conn.on('close', () => {
                this.deviceMonitorConnection = undefined;
                this.deviceData = {};
            });
        } catch (e: any) {
            connectionDeferred.reject(e);
            throw e;
        }
    }

    private deviceData: Record<string, Record<string, string | number>> = {};

    // Listen for events by using readMessageFromStream in an async iterator:
    async listenToMessages(socket: net.Socket) {
        while (true) {
            const message = await readMessageFromStream(socket);
            if (message === null) {
                this.close();
                return;
            }

            if (message.MessageType === 'Attached') {
                this.deviceData[message.DeviceID] = message.Properties;
            } else if (message.MessageType === 'Detached') {
                delete this.deviceData[message.DeviceID];

            }
        }
    }

    async getDevices() {
        await this.startListeningForDevices();
        return this.deviceData;
    }

    close() {
        if (this.deviceMonitorConnection instanceof net.Socket) {
            this.deviceMonitorConnection?.end();
        } else if (this.deviceMonitorConnection?.then) {
            this.deviceMonitorConnection
                .then((conn) => conn.destroy())
                .catch(() => {});
        }

        this.deviceData = {};
    }

}