import * as net from 'net';
import * as plist from 'plist';

const DEFAULT_ADDRESS = process.platform === 'win32'
    ? { port: 27015 }
    : { path: '/var/run/usbmuxd' };

export async function getUsbmuxClient(
    connectionOptions: net.NetConnectOpts = DEFAULT_ADDRESS
) {
    const conn = net.connect(connectionOptions);

    await new Promise((resolve, reject) => {
        conn.on('connect', resolve);
        conn.on('error', reject);
    });

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

    return new UsbmuxClient(conn);
}

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

    const header = stream.read(16);
    if (!header) {
        await new Promise((resolve, reject) => {
            stream.once('readable', resolve);
            stream.once('close', resolve);
            stream.once('error', reject);
        });
        return readMessageFromStream(stream);
    }

    const payloadLength = header.readUInt32LE(0) - 16; // Minus the header length

    const payload = stream.read(payloadLength);
    if (!payload) {
        stream.unshift(header);
        await new Promise((resolve, reject) => {
            stream.once('readable', resolve);
            stream.once('close', resolve);
            stream.once('error', reject);
        });
        return readMessageFromStream(stream);
    }

    return plist.parse(payload.toString('utf8')) as ResponseMessage;
}

class UsbmuxClient {

    constructor(
        private socket: net.Socket
    ) {
        this.listenToMessages(socket)
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

    getDevices() {
        return this.deviceData;
    }

    close() {
        this.socket.end();
        this.deviceData = {};
    }

}

export type { UsbmuxClient };