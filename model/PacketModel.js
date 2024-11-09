const net = require('net');

const host = '127.0.0.1'; // "127.0.0.1";

class WritePacket {
    constructor(data = null) {
        let port;
        if (typeof data === 'number') {
            port = data;
        } else {
            this.scheme = JSON.parse(JSON.stringify(data));
            this.protocol = data.protocol;
            port = this.protocol.port;
        }
        this.data = [];
        this.client = net.connect({ host, port });
    }

    format(buf) {
        return buf.toString('hex').match(/.{2}/g).map(e => "0x"+e);
    }

    WriteBytes(value, method = "push") {
        if (typeof value !== "object") {
            value = [value];
        }
        value.forEach(e => this.data[method](e));
    }

    WriteUByte(value, method = 'push') {
        const buf = Buffer.allocUnsafe(1);
        value < 0 && (value = 0xff - 1 - value);
        buf.writeUInt8(value, 0);
        this.data[method](...this.format(buf));
    }

    WriteUInt16(value, method = "push") {
        const buf = Buffer.allocUnsafe(2);
        value < 0 && (value = 0xffff - 1 - value);
        buf.writeUInt16BE(value, 0);
        this.data[method](...this.format(buf));
    }

    WriteUInt32(value, method = "push") {
        const buf = Buffer.allocUnsafe(4);
        value < 0 && (value = 0xffffffff - 1 - value);
        buf.writeUInt32BE(value, 0);
        this.data && this.data[method](...this.format(buf));
    }

    WriteFloat(value, method = "push") {
        const buf = Buffer.allocUnsafe(4);
        buf.writeFloatBE(value, 0);
        this.data[method](...this.format(buf));
    }

    WriteOctets(value = '') {
        if (value && value.match(/[0-9A-Fa-f]/g)) {
            const values = value.match(/.{2}/g).map(e => '0x'+e);
            this.WriteCUInt(values.length);
            this.data.push(...values);
        } else {
            this.WriteCUInt(0);
        }
    }

    WriteString(value = '', coding = 'utf16le') {
        if (!value) {
            return this.WriteUByte(0);
        }
        const buf = this.format(Buffer.from(value, coding));
        this.WriteCUInt(buf.length);
        this.data.push(...buf);
    }

    WriteCUInt(value, method = "push") {
        if (value <= 0x7F) {
            return this.WriteUByte(value, method);
        } else if (value <= 0x3FFF) {
            return this.WriteUInt16(value + 0x8000, method);
        } else if (value <= 0x1FFFFFFF) {
            return this.WriteUInt32(value + 0xC0000000, method);
        } else {
            return this.WriteUByte(0xE0, method) || this.WriteUInt32(value, method);
        }
    }

    Pack(value) {
        if (this.data) {
            const len = this.data.length;
            this.WriteCUInt(len, "unshift");
            this.WriteCUInt(value, "unshift");
        }
    }

    WriteArray(scheme, data) {
        this.WriteCUInt(data.length);
        for (const item of data) {
            for (const [name, type] of scheme) {
                if (name === "length") { continue; }
                this['Write'+type](item[name]);
            }
        }
    }

    PackAll(data) {
        const scheme = this.scheme;

        for (const category in scheme) {
            if (category === "protocol" || category === "misc") { continue; }
            const fields = scheme[category];
            for (const [field, type] of fields) {
                const value = data[category][field];
                if (typeof type === "string") {
                    this['Write'+type](value);
                } else {
                    this.WriteArray(type[1], value);
                }
            }
        }
        this.Pack(this.protocol.request);
        return this.Send();
    }

    async Request(readScheme = null) {
        let raw = await this.Send();
        const pos = raw.indexOf(this.protocol.response, 0, 'hex');
        if (!readScheme) { readScheme = this.scheme; }
        if (pos > 0) { raw = raw.slice(pos); }
        const reader = new ReadPacket(raw, readScheme);
        const response = reader.UnpackAll();
        return response;
    }

    Send() {
        return new Promise((resolve, reject) => {
            this.client.write(Buffer.from(this.data), 'utf8');
            this.client.on('data', (data) => {
                this.client.destroy();
                return resolve(data);
            });
            this.client.on('error', (data) => {
                this.client.destroy();
                console.error(data);
                return reject('Error: Cannot connect to server!');
            });
        });
    }
}

class ReadPacket {
    constructor(data = null, scheme = null) {
        this.buf = Buffer.from(data, 'binary');
        this.pos = 0;
        if (scheme) {
            this.protocol = scheme.protocol;
            delete scheme.protocol;
            this.scheme = scheme;
        }
    }

    ReadHeader() {
        return {
            opCode: this.ReadCUInt(),
            length: this.ReadCUInt(),
            retCode: this.ReadUInt32()
        };
    }

    ReadBytes(length) {
        const data = this.buf.toString('hex', this.pos, this.pos+length).match(/.{2}/g);
        this.pos += length;
        return data;
    }

    ReadUByte() {
        const data = this.buf.readUInt8(this.pos);
        this.pos++;
        return data;
    }

    ReadFloat() {
        const data = this.buf.readFloatBE(this.pos);
        this.pos += 4;
        return data.toFixed(4);
    }

    ReadUInt16() {
        const data = this.buf.readUInt16BE(this.pos);
        this.pos += 2;
        return data;
    }

    ReadUInt32() {
        const data = this.buf.readUInt32BE(this.pos);
        this.pos += 4;
        return data;
    }

    ReadOctets() {
        const length = this.ReadCUInt();
        const data = this.buf.toString('hex', this.pos, this.pos+length);
        this.pos += length;
        return data;
    }

    ReadString() {
        const length = this.ReadCUInt();
        const data = this.buf.toString('utf16le', this.pos, this.pos+length);
        this.pos += length;
        return data;
    }

    ReadCUInt() {
        let value = this.ReadUByte();
        switch(value & 0xE0) {
            case 0xE0:
                value = this.ReadUInt32();
                break;
            case 0xC0:
                this.pos--;
                value = this.ReadUInt32() & 0x1FFFFFFF;
                break;
            case 0x80:
            case 0xA0:
                this.pos--;
                value = (this.ReadUInt16()) & 0x3FFF;
                break;
        }
        return value;
    }

    ReadArray(scheme) {
        scheme = [...scheme];
        const length = this['Read'+scheme.shift()[1]]();
        const items = [];
        for (let i = 0; i < length; i++) {
            const item = scheme.reduce((item, [name, type]) => {
                if (typeof type === "string") {
                    item[name] = this['Read'+type]();
                } else {
                    item[name] = this['Read'+type[0]](type[1]);
                }
                return item;
            }, {});
            items.push(item);
        }
        return items;
    }

    Seek(value) {
        this.pos += value;
    }

    UnpackAll() {
        const scheme = this.scheme;
        const result = {};
        if (this.protocol) {
            result.protocol = this.ReadHeader();
        }
        for (const keys in scheme) {
            result[keys] = {};
            const prop = result[keys];
            for (const [name, type] of scheme[keys]) {
                try {
                    if (scheme[keys][0] === "Array") {
                        return this.ReadArray(scheme[keys][1]);
                    }

                    prop[name] = typeof type === "string"
                        ? this[`Read${type}`]()
                        : this.ReadArray(type[1]);
                } catch (err) {
                    return {
                        error: err,
                        key: keys,
                        name: name
                    };
                }
            }

        }
        return result;
    }
}

module.exports = { WritePacket, ReadPacket };
