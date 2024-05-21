import * as stream from 'stream';

const isReadablePromise = (input: stream.Readable) => new Promise<void>((resolve, reject) => {
    input.once('readable', resolve);
    input.once('close', resolve);
    input.once('error', reject);
});

export async function readBytes(input: stream.Readable, bytesToRead: number) {
    const data: Buffer | null = input.read(bytesToRead);

    if (!data) {
        await isReadablePromise(input);
        return readBytes(input, bytesToRead);
    }

    if (data.byteLength > bytesToRead) {
        // Stream is finished - take the bit we want and put the rest back
        input.unshift(data.subarray(bytesToRead));
        return data.subarray(0, bytesToRead);
    }

    return data;
}
