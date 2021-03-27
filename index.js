const mc = require('minecraft-protocol');

const server = mc.createServer({
    "online-mode": false,
    port: 25566,
    keepAlive: false,
    version: '1.8.9'
});

server.on('login', client => {
    console.log(`Connecting from ${client.socket.remoteAddress}`);

    const remoteClient = mc.createClient({
        host: 'hypixel.net',
        port: 25565,
        username: client.username,
        keepAlive: false,
        version: '1.8.9'
    });

    const handleClientPacket = (data, meta) => {
        if (meta.name === 'custom_payload') {
            if (data.channel.toUpperCase().includes('FML|HS')) return;
            if (data.channel.toUpperCase().includes('REGISTER')) return;

            if (data.channel.toUpperCase().includes('MC|BRAND')) {
                remoteClient.registerChannel('MC|Brand', ['string'], false);
                remoteClient.writeChannel('MC|Brand', 'vanilla');

                return;
            }
        }

        if (remoteClient.state === mc.states.PLAY && meta.state === mc.states.PLAY) {
            remoteClient.write(meta.name, data);
        }
    }

    const handleRemoteClientPacket = (data, meta) => {
        if (meta.state === mc.states.PLAY && client.state === mc.states.PLAY) {
            client.write(meta.name, data);

            if (meta.name === 'set_compression') {
                client.compressionThreshold = data.threshold;
            }
        }
    }

    client.addListener('packet', handleClientPacket);
    remoteClient.addListener('packet', handleRemoteClientPacket);

    const shutdownConnections = () => {
        client.end('HProxy | Client disconnect.');
        remoteClient.end('Disconnect.');

        client.removeListener('packet', handleClientPacket);
        remoteClient.removeListener('packet', handleRemoteClientPacket);
    }

    remoteClient.once('end', () => {
        console.log('Remote connection ended');

        shutdownConnections();
    });

    client.once('end', () => {
        console.log('Client connection ended');

        shutdownConnections();
    });
});

console.log('Server ready.');