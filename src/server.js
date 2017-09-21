const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory
// __dirname in node is the current directory
// (in this case the same folder as the server js file)
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, {
    'Content-Type': 'text/html',
  });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1: ${port}`);

// pass in the http server into socketio and grab websocket server as io
const io = socketio(app);

// will hold all users
const users = {};

const onJoined = (sock) => {
  const socket = sock;
  socket.on('join', (data) => {
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    socket.name = data.name;
    users[socket.name] = socket.name;

    console.dir(users);

    socket.emit('msg', joinMsg);
    socket.join('room1');

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };
    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);
    socket.emit('msg', {
      name: 'server',
      msg: 'You joined the room',
    });
  });
};

const onMsg = (sock) => {
  const socket = sock;
  socket.on('msgToServer', (data) => {
    io.sockets.in('room1').emit('msg', {
      name: socket.name,
      msg: data.msg,
    });
  });
};

const onSwear = (sock) => {
  const socket = sock;

  socket.on('swear', () => {
    io.sockets.in('room1').emit('action', {
      name: socket.name,
      msg: ' Tried to swear!',
    });
  });
};

const onMe = (sock) => {
  const socket = sock;

  socket.on('slashMe', (data) => {
    io.sockets.in('room1').emit('action', {
      name: socket.name,
      msg: data.msg,
    });
  });
};

const onRoll = (sock) => {
  const socket = sock;


  socket.on('roll', () => {
    const randomNum = Math.floor(Math.random() * 20);

    io.sockets.in('room1').emit('action', {
      name: socket.name,
      msg: ` Rolled a ${randomNum}!`,
    });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    const leaveMsg = `${socket.name} has left the room.`;

    socket.broadcast.to('room1').emit('msg', {
      name: 'server',
      msg: leaveMsg,
    });


    console.log(`${socket.name} has left`);

    socket.leave('room1');


    delete users[socket.name];
    console.dir(users);
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
  onMe(socket);
  onRoll(socket);
  onSwear(socket);
});

console.log('Websocket Server Started');
