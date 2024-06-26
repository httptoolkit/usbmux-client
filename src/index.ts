import * as net from 'net';
import * as plist from 'plist';
import { delay, getDeferred, CustomError } from '@httptoolkit/util';

import { readBytes } from './stream-utils';

const DEFAULT_ADDRESS = process.platform === 'win32'
    ? { port: 27015, autoSelectFamily: true }
    : { path: '/var/run/usbmuxd' };

const CLIENT_VERSION = 'usbmux-client';
const PROG_NAME = 'usbmux-client';

function plistSerialize(value: any) {
    const plistString = plist.build(value)
    const plistBuffer = Buffer.from(plistString, 'utf8');

    const length = 16 + plistBuffer.byteLength; // Header always 16 bytes
    const version = 1; // Also called 'reserved' - some docs say 0, but only 1 seems to work
    const messageType = 8; // 8 is 'plist' message type
    const tag = 1; // Echoed in responses, not used for now

    const messageHeader = Buffer.alloc(16);
    messageHeader.writeUInt32LE(length, 0);
    messageHeader.writeUInt32LE(version, 4);
    messageHeader.writeUInt32LE(messageType, 8);
    messageHeader.writeUInt32LE(tag, 12);

    return Buffer.concat([messageHeader, plistBuffer], length);
}

const swap16bitEndianness = (port: number) => {
    const buffer = Buffer.alloc(2);
    buffer.writeUint16LE(port);
    return buffer.readUint16BE();
}

function requestTunnelMessage(deviceId: number, port: number) {
    return plistSerialize({
        MessageType: 'Connect',
        ClientVersionString: CLIENT_VERSION,
        ProgName: PROG_NAME,
        DeviceID: deviceId,
        PortNumber: swap16bitEndianness(port)
    });
}

type ResultMessage = { MessageType: 'Result', Number: number };
type AttachedMessage = { MessageType: 'Attached', DeviceID: number, Properties: DeviceInfo };
type DetachedMessage = { MessageType: 'Detached', DeviceID: number };

type ResponseMessage =
    | ResultMessage
    | AttachedMessage
    | DetachedMessage;

const readUsbmuxdMessageFromStream = async (stream: net.Socket): Promise<Buffer | null> => {
    if (stream.closed) return null;

    const header = await readBytes(stream, 16);

    const payloadLength = header.readUInt32LE(0) - 16; // Minus the header length
    return readBytes(stream, payloadLength);
}

const readPlistMessageFromStream = async (stream: net.Socket): Promise<ResponseMessage | null> => {
    const payload = await readUsbmuxdMessageFromStream(stream);
    if (!payload) return null;

    return plist.parse(payload.toString('utf8')) as ResponseMessage;
}

// Lockdown server format is slightly different: just the payload length (32 bytes BE) then a plist payload body.

function lockdowndMessage(value: any) {
    const plistString = plist.build(value)
    const plistBuffer = Buffer.from(plistString, 'utf8');

    const length = plistBuffer.byteLength;

    const message = Buffer.alloc(4 + length);
    message.writeUInt32BE(length, 0); // Big endian!
    plistBuffer.copy(message, 4);
    return message;
}

type QueryTypeResult = { Request: string, Type: string };

// Not clear if these are all values, or if they're always available on all devices, but this is probably a good
// representative sample of the main keys people might be interested in.
type LockdownValues = {
    BasebandCertId: number,
    BasebandKeyHashInformation: {
        AKeyStatus: number,
        SKeyHash: Buffer,
        SKeyStatus: number
    },
    BasebandSerialNumber: Buffer,
    BasebandVersion: string,
    BoardId: number,
    BuildVersion: string,
    CPUArchitecture: string,
    ChipID: number,
    DeviceClass: string,
    DeviceColor: string,
    DeviceName: string,
    DieID: number,
    HardwareModel: string,
    HasSiDP: boolean,
    PartitionType: string,
    ProductName: string,
    ProductType: string,
    ProductVersion: string,
    ProductionSOC: boolean,
    ProtocolVersion: string,
    SupportedDeviceFamilies: Array<number>,
    TelephonyCapability: boolean,
    UniqueChipID: number,
    UniqueDeviceID: string,
    WiFiAddress: string
};
type LockdownKey = keyof LockdownValues;

type GetValueResult<k extends LockdownKey> = { Request: string, Key: k, Value: LockdownValues[k]  };
type GetValuesResult = { Request: string, Value: Partial<LockdownValues> };
type LockdownMessage =
    | QueryTypeResult
    | GetValueResult<any>
    | GetValuesResult;

const readMessageFromLockdowndStream = async (stream: net.Socket): Promise<LockdownMessage | null> => {
    if (stream.closed) return null;

    const header = await readBytes(stream, 4);

    const payloadLength = header.readUInt32BE(0);
    const payload = await readBytes(stream, payloadLength);

    const data = plist.parse(payload.toString('utf8'));
    if ((data as any).Error) {
        throw new Error(`Received lockdown error: ${(data as any).Error.toString()}`);
    }

    return data as LockdownMessage;
}

const connectSocket = async (options: net.NetConnectOpts) => {
    const conn = net.connect(options);

    await new Promise((resolve, reject) => {
        conn.once('connect', resolve);
        conn.once('error', reject);
    });

    return conn;
}

// Most properties optional because we're not sure what's actually guaranteed:
export interface DeviceInfo {
    DeviceID: number;
    ConnectionSpeed?: number;
    ConnectionType?: string;
    LocationID?: number;
    ProductID?: number;
    SerialNumber?: string;
}

export class UsbmuxError extends CustomError {

    constructor(operation: string, response: ResponseMessage | null) {
        const failureType = response === null
                ? 'usbmux-connection-failure'
            : response.MessageType !== 'Result'
                ? `usbmux-unexpected-${response.MessageType}-message`
            : `usbmux-unexpected-${response.Number}-result`;

        super(`Usbmux ${operation} request failed: ${failureType}`, {
            code: failureType
        });
    }

}

export class UsbmuxClient {

    constructor(
        private connectionOptions: net.NetConnectOpts = DEFAULT_ADDRESS
    ) {}

    deviceMonitorConnection: net.Socket | Promise<net.Socket> | undefined;

    private async startListeningForDevices() {
        if (this.deviceMonitorConnection instanceof net.Socket) return;
        else if (this.deviceMonitorConnection?.then) return this.deviceMonitorConnection;

        const connectionDeferred = getDeferred<net.Socket>();
        this.deviceMonitorConnection = connectionDeferred.promise;

        // Ignore any uncaught errors here - they'll be thrown by any pending getDevices()
        // calls waiting on the promise, or thrown separately (in the catch block below) by
        // this call, but we don't want uncaught rejection issues in other cases.
        connectionDeferred.promise.catch(() => {});

        try {
            const conn = await connectSocket(this.connectionOptions);

            // Start listening for connected devices:
            conn.write(plistSerialize({
                MessageType: 'Listen',
                ClientVersionString: CLIENT_VERSION,
                ProgName: PROG_NAME
            }));

            const response = await readPlistMessageFromStream(conn);
            if (
                response === null ||
                response.MessageType !== 'Result' ||
                response.Number !== 0
            ) {
                throw new UsbmuxError('listen', response);
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
            this.deviceMonitorConnection = undefined;
            connectionDeferred.reject(e);
            throw e;
        }
    }

    private deviceData: Record<string, DeviceInfo> = {};

    // Listen for events by using readMessageFromStream in an async iterator:
    async listenToMessages(socket: net.Socket) {
        while (true) {
            const message = await readPlistMessageFromStream(socket);
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

    async getDevices(): Promise<Record<string, DeviceInfo>> {
        await this.startListeningForDevices();
        return this.deviceData;
    }

    async close() {
        if (this.deviceMonitorConnection instanceof net.Socket) {
            this.deviceMonitorConnection?.end();
        } else if (this.deviceMonitorConnection?.then) {
            await this.deviceMonitorConnection
                .then((conn) => conn.destroy())
                .catch(() => {});
        }

        await Promise.all(this.openTunnels.map((tunnel) => tunnel.destroy()));

        this.deviceData = {};
    }

    readonly openTunnels: Array<net.Socket> = [];

    async createDeviceTunnel(deviceId: string | number, port: string | number): Promise<net.Socket> {
        const conn = await connectSocket(this.connectionOptions);

        this.openTunnels.push(conn);
        conn.on('close', () => {
            const index = this.openTunnels.indexOf(conn);
            if (index === -1) return;
            this.openTunnels.splice(index, 1);
        });

        conn.write(requestTunnelMessage(Number(deviceId), Number(port)));
        const response = await readPlistMessageFromStream(conn);

        if (
            response === null ||
            response.MessageType !== 'Result' ||
            response.Number !== 0
        ) {
            throw new UsbmuxError('tunnel', response);
        };

        return conn;
    }

    private async getLockdownTunnel(deviceId: string | number) {
        const tunnel = await this.createDeviceTunnel(deviceId, 62078);
        tunnel.write(lockdowndMessage({ Label: 'usbmux-client', Request: 'QueryType' }));

        const response = await readMessageFromLockdowndStream(tunnel) as QueryTypeResult;
        if (response?.Type !== 'com.apple.mobile.lockdown') throw new Error(`Unexpected lockdown response: ${response}`);

        return tunnel;
    }

    async queryDeviceValue<K extends LockdownKey>(deviceId: string | number, key: K) {
        const tunnel = await this.getLockdownTunnel(deviceId);
        tunnel.write(lockdowndMessage({ Label: 'usbmux-client', Request: 'GetValue', Key: key }));
        const message = await readMessageFromLockdowndStream(tunnel) as GetValueResult<K>
        tunnel.end();
        return message.Value;
    }

    async queryAllDeviceValues(deviceId: string | number) {
        const tunnel = await this.getLockdownTunnel(deviceId);
        tunnel.write(lockdowndMessage({ Label: 'usbmux-client', Request: 'GetValue' }));
        const message = await readMessageFromLockdowndStream(tunnel) as GetValuesResult
        tunnel.end();
        return message.Value;
    }

}