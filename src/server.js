var http = require("http");
var url = require('url');
var fs = require('fs');

var player1_name;
var player2_name;
var player1_choice;
var player2_choice;

var countdowntimer;

var server = http.createServer(function(request, response){
    console.log('Connection');
    var path = url.parse(request.url).pathname;

    switch(path){
      case '/':
        response.writeHead(200, {'Content-Type': 'text/html'});
        response.end('Welcome to AKQA Techinsight!');
        break;
      default:
        fs.readFile(__dirname + path, function(error, data){
          if (error){
            console.log(error);
            response.writeHead(404);
            response.end("opps this doesn't exist - 404");
          }
          else{
            response.writeHead(200, {"Content-Type": "text/html"});
            response.end(data, "utf8");
          }
        });
        break;
    }
});

server.listen(8001);

// use socket.io
var io = require('socket.io').listen(server);

//turn off debug
io.set('log level', 1);

// define interactions with client
io.sockets.on('connection', function(socket){
    
    socket.on('event', function(data){

        if(data.type !== undefined){
            switch(data.type){
                case 'stop':
                    stop();
                    break;
                case 'join':
                    newPlayerJoin(data);
                    break;
                case 'bet':
                    bet(data);
                    break;
                default:
                    break;
            }
            
        }

    });

    socket.on('disconnect', function () {
        stop();

    });

    function clear(){
        player1_choice = undefined;
        player2_choice = undefined;
    }

    function newPlayerJoin(data){
        process.stdout.write('join:' + data.playername);

        if(player1_name === undefined){
            player1_name = data.playername;
        }
        else if(player2_name === undefined){
            player2_name = data.playername;
        }

        // sending to all clients except sender
        socket.broadcast.emit('event', {'type': 'join', 'playername': data.playername});

        if(player1_name !== undefined && player2_name !== undefined){
            io.sockets.emit('event', {'type': 'start'});
        }
    } 

    // receive bet event
    function bet(data){
        process.stdout.write('bet|playername:' + data.playername + ', choice:' + data.choice);

        if(data.playername === player1_name){
            player1_choice = data.choice;
        }
        else{
            player2_choice = data.choice;
        }

        if(player1_name !== undefined && player2_name !== undefined && player1_choice !== undefined && player2_choice !== undefined){
            io.sockets.emit('event', {'type': 'bet', 'player1_name': player1_name, 'player1_choice' : player1_choice, 'player2_name': player2_name, 'player2_choice' : player2_choice});    

            clear();
        }
    }

    function stop(){
        player1_name = undefined;
        player2_name = undefined;
        player1_choice = undefined;
        player2_choice = undefined;

        io.sockets.emit('event', {'type': 'stop'});
    }

});