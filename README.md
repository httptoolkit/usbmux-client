# Usbmux-Client [![Build Status](https://github.com/httptoolkit/usbmux-client/workflows/CI/badge.svg)](https://github.com/httptoolkit/usbmux-client/actions) [![Available on NPM](https://img.shields.io/npm/v/usbmux-client.svg)](https://npmjs.com/package/usbmux-client)

> _Part of [HTTP Toolkit](https://httptoolkit.com): powerful tools for building, testing & debugging HTTP(S)_

A pure-js Node.js library for communicating with iPhones over USB via usbmux, with a pure-JS solution for Node.js that works on all platforms.

This provides fully cross-platform access to iOS devices, supporting the usbmuxd daemon built into iTunes on Windows & Mac, and the libimobiledevice implementation on Linux.

This is used within HTTP Toolkit to connect to TCP ports on a connected iPhone via USB, primarily to communicate with Frida using [Frida-JS](https://github.com/httptoolkit/frida-js/). It's currently focused on the core features required for that use case, but PRs to add support for more features are welcome. Right now it supports:

* Monitoring the list of connected devices
* Querying the metadata for any connected device (to get the device name, device type, UDID, architecture, etc)
* Opening a direct connection to any port on the device itself

## Example

```javascript
import { UsbmuxClient } from 'usbmux-client';

const client = new UsbmuxClient();

const devices = await client.getDevices();
// Returns a map from id to basic data like {
//   "1": { ConnectionType: "USB", DeviceId: "1", ... }
// }

const firstDeviceId = Object.keys(devices)[0];
const deviceMetadata = await client.queryAllDeviceValues(firstDeviceId);
// Returns detailed data like { DeviceClass: "iPhone", DeviceName: "Alice's iPhone", ... }

// Returns a net.Socket connected to the given port on the target device:
const conn = await client.createDeviceTunnel(firstDeviceId, 1234);
```