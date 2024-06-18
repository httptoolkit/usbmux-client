# Usbmux-Client [![Build Status](https://github.com/httptoolkit/usbmux-client/workflows/CI/badge.svg)](https://github.com/httptoolkit/usbmux-client/actions) [![Available on NPM](https://img.shields.io/npm/v/usbmux-client.svg)](https://npmjs.com/package/usbmux-client) [![Funded by NLnet - NGI Zero Entrust](https://img.shields.io/badge/Funded%20by%20NLnet-NGI%20Zero%20Entrust-98bf00?logo=data:image/svg%2bxml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjcuNCAxNjguMiI%2BPHBhdGggZD0iTTEyNyA0NC45YzEuNC0xMS0xLjMtMjAuOC04LjEtMjkuNVMxMDMuMiAxLjcgOTIuMi40cy0yMC43IDEuMi0yOS40IDhBMzggMzggMCAwIDAgNDggMzIuNmwtLjQgMi41LS4yIDIuNWEzOS4zIDM5LjMgMCAwIDAgOC40IDI3QTM4IDM4IDAgMCAwIDgwIDc5LjNsMi40LjQgMS4zLjJhNDQgNDQgMCAwIDEgNS4yLTEyLjQgMzguMSAzOC4xIDAgMCAxLTQuNy0uMUg4NEEyNi41IDI2LjUgMCAwIDEgNjUuNyA1NyAyNi41IDI2LjUgMCAwIDEgNjAgNDJhMjcuOCAyNy44IDAgMCAxIC4yLTUuM3YtLjJjMS03LjUgNC40LTEzLjUgMTAuNC0xOC4xYTI2IDI2IDAgMCAxIDIwLjItNS42IDI2IDI2IDAgMCAxIDE4LjMgMTAuMyAyNyAyNyAwIDAgMSA0LjcgMjUuMWM0LjItMS4zIDguNi0yIDEzLjItMmwuMi0xLjN6bTUuMyA2LjYtMi41LS4zYTM5LjQgMzkuNCAwIDAgMC0yNyA4LjVBMzguNCAzOC40IDAgMCAwIDg4IDgzLjhjNC4zLjggOC4zIDIgMTIgMy45YTI2LjUgMjYuNSAwIDAgMSAxMC4zLTE4LjFjNC42LTMuNiA5LjYtNS42IDE1LTZhMjcuOCAyNy44IDAgMCAxIDUuNC4zaC4xYzcuNSAxIDEzLjUgNC40IDE4LjIgMTAuNGEyNiAyNiAwIDAgMSA1LjYgMjAuMiAyNy4zIDI3LjMgMCAwIDEtMzAuNSAyNGMuOSA0IDEuMSA4LjMuOCAxMi43IDEwIC42IDE5LTIuMiAyNy04LjVBMzguNiAzOC42IDAgMCAwIDE2NyA5Ni4xYzEuNC0xMS0xLjQtMjAuOC04LjItMjkuNS02LjMtOC0xNC4zLTEzLTI0LjEtMTQuN2wtMi41LS40ek0xMjkgNzguN2MtMy40LS40LTYuNS41LTkuMiAyLjZzLTQuMyA1LTQuNyA4LjNjLS41IDMuNS40IDYuNSAyLjUgOS4zczUgNC4zIDguNCA0LjdjMy40LjQgNi40LS40IDkuMi0yLjZzNC4zLTQuOSA0LjctOC4zYy40LTMuNC0uNC02LjUtMi42LTkuMnMtNC45LTQuMy04LjMtNC44em0tMTE2LTVjLjktNy42IDQuMy0xMy44IDEwLjMtMTguNCA2LTQuNyAxMi43LTYuNiAyMC4xLTUuNmE0NC4zIDQ0LjMgMCAwIDEtLjgtMTIuNyAzOCAzOCAwIDAgMC0yNyA4LjRDNi44IDUyLjIgMS44IDYxLjEuNSA3Mi4xczEuMyAyMC43IDguMSAyOS41YTM4IDM4IDAgMCAwIDI0LjIgMTQuN2wyLjQuNCAyLjUuMmM0LjYuMyA5LS4xIDEzLjItMS4zQTQxLjYgNDEuNiAwIDAgMCA3NSA5Ni44YTM4IDM4IDAgMCAwIDQuNC0xMi41Yy00LjMtLjctOC4zLTItMTItMy44YTI2LjUgMjYuNSAwIDAgMS0xMC4zIDE4LjEgMjYuNiAyNi42IDAgMCAxLTIwLjMgNS43aC0uMmMtNy40LTEtMTMuNS00LjUtMTguMS0xMC40LTQuNy02LTYuNi0xMi44LTUuNy0yMC4zek0zMi40IDY3YTEyIDEyIDAgMCAwLTQuOCA4LjQgMTIgMTIgMCAwIDAgMi42IDkuMSAxMiAxMiAwIDAgMCA4LjMgNC44IDEyLjUgMTIuNSAwIDAgMCAxNC0xMC45Yy40LTMuNC0uNC02LjUtMi42LTkuMmExMS45IDExLjkgMCAwIDAtOC4zLTQuN2MtMy41LS41LTYuNS40LTkuMiAyLjV6bTY0LjgtMzQuOGExMiAxMiAwIDAgMC04LjQtNC43Yy0zLjQtLjQtNi41LjQtOS4xIDIuNmExMS44IDExLjggMCAwIDAtNC44IDguM2MtLjQgMy40LjUgNi41IDIuNiA5LjIgMi4xIDIuNyA0LjkgNC4zIDguMyA0LjggMy40LjMgNi40LS41IDkuMi0yLjYgMi43LTIuMiA0LjMtNSA0LjctOC4zLjQtMy41LS40LTYuNi0yLjUtOS4zek04NSA4OC40bC0xLjMtLjFhNDIuMyA0Mi4zIDAgMCAxLTUuMSAxMi4zYzEuNSAwIDMuMSAwIDQuNy4yaC4yYTI2LjQgMjYuNCAwIDAgMSAxOC4zIDEwLjRjMy42IDQuNSA1LjUgOS41IDUuOCAxNWEyNy45IDI3LjkgMCAwIDEtLjIgNS4zdi4yYy0xIDcuNC00LjQgMTMuNS0xMC4zIDE4LjEtNiA0LjctMTIuOCA2LjUtMjAuMyA1LjZzLTEzLjYtNC40LTE4LjMtMTAuM2EyNi4zIDI2LjMgMCAwIDEtNC42LTI1LjJjLTQuMiAxLjQtOC42IDItMTMuMiAybC0uMiAxLjRhMzguNCAzOC40IDAgMCAwIDguMiAyOS40YzYuOCA4LjcgMTUuNyAxMy44IDI2LjYgMTUuMXMyMC43LTEuNCAyOS41LTguMmM4LTYuMyAxMy0xNC4zIDE0LjctMjQuMWwuNC0yLjUuMi0yLjRhMzkuNSAzOS41IDAgMCAwLTMyLjYtNDEuOGwtMi41LS40em01IDMyYTEyLjEgMTIuMSAwIDAgMC04LjQtNC43IDEyIDEyIDAgMCAwLTkuMSAyLjYgMTIuMSAxMi4xIDAgMCAwLTQuOCA4LjMgMTIgMTIgMCAwIDAgMi42IDkuMmMyLjEgMi44IDQuOSA0LjMgOC4zIDQuN2ExMi40IDEyLjQgMCAwIDAgMTMuOS0xMC45Yy40LTMuNC0uNC02LjQtMi41LTkuMnoiLz48L3N2Zz4%3D&labelColor=ffffff)](https://nlnet.nl/project/AppInterception/)

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

---

This library is part of [a broader HTTP Toolkit project](https://httptoolkit.com/blog/frida-mobile-interception-funding/), funded through the [NGI Zero Entrust Fund](https://nlnet.nl/entrust), established by [NLnet](https://nlnet.nl) with financial support from the European Commission's [Next Generation Internet](https://ngi.eu) program. Learn more on the [NLnet project page](https://nlnet.nl/project/F3-AppInterception#ack).

[<img src="https://nlnet.nl/logo/banner.png" alt="NLnet foundation logo" width="20%" />](https://nlnet.nl)
[<img src="https://nlnet.nl/image/logos/NGI0Entrust_tag.svg" alt="NGI Zero Entrust Logo" width="20%" />](https://nlnet.nl/entrust)
