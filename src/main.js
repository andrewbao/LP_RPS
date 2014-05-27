var controller;
var socket;
var serveraddress = 'http://127.0.0.1:8001';//'http://192.168.199.120:8001';
var status = 'stop';

var myname;
var anothername;
var mychoice;
var anotherchoice;

$(document).ready(function() {
	socket = io.connect(serveraddress);

	socket.emit('event', {'type': 'stop'});	

	socket.on('event', function(data){
		if(data.type !== undefined){
			switch(data.type){
				case 'start':
					status = 'start';
					start();
					break;
				case 'stop':
					status = 'stop';
					stop();
					break;
				case 'bet':
					bet(data);
					break;
				case 'join':
					playerJoin(data);
					break;
				default:
					break;
			}
		}
	});

	function playerJoin(data){
		if(data.playername !== undefined && data.playername !== '' && (anothername === undefined || anothername === '')){
			setAnothername(data.playername);
			notifyAnotherPlayer();
		}
	}

	function bet(data){
		var result;
		var winner;

		if(myname === data.player1_name){
			mychoice = data.player1_choice;
			anotherchoice = data.player2_choice;
		}
		else{
			mychoice = data.player2_choice;
			anotherchoice = data.player1_choice;
		}

		console.log('player1:' + data.player1_name + ', ' + data.player1_choice);
		console.log('player2:' + data.player2_name + ', ' + data.player2_choice);
		console.log('');

		if(mychoice === anotherchoice){
			winner = '';
		}
		else{
			var temp = mychoice.toString() + anotherchoice.toString();
			switch(temp){
				case '12':
					winner = myname;
					break;
				case '13':
					winner = anothername;
					break;
				case '23':
					winner = myname;
					break;
				case '21':
					winner = anothername;
					break;
				case '31':
					winner = myname;
					break;
				case '32':
					winner = anothername;
					break;
			}
		}

		if(winner === myname){
			result = '<font color="green">WON</font>';
		}
		else if(winner === anothername){
			result = '<font color="red">LOSE</font>';
		}
		else{
			result = '<font color="red">DRAW</font>';
		}

		if(result !== undefined && result !== ''){
			$('#gameresult').append('<div>' + renderChoice(mychoice) + result + renderChoice(anotherchoice) + '</div>');	
		}

		clear();
	}

	function clear(){
		mychoice = undefined;
		anotherchoice = undefined;
	}

	function renderChoice(choiceValue){
		switch(choiceValue){
			case 1:
				return '<img src="imgs/rock.png">';
				break;
			case 2:
				return '<img src="imgs/scissors.png">';
				break;
			case 3:
				return '<img src="imgs/paper.png">';
				break;
			default:
				break;
		}
	}

	$('#control').click(function(event) {
		var controlbutton = $('#control');
		if(status === 'stop'){
			checkPlayer1Name();
		}
		else{
			socket.emit('event', {'type': 'stop'});	
		}
	});

});

var countdowntimer;
function startCountdown(){
	var countdown = 5;
    if(countdowntimer === undefined){
        countdowntimer = setInterval(function(){
			$('#countdown').text(countdown);

            if(countdown === 0){
                // send choice
                var choice = mychoice;

                // if there is no data from leap motion, randomly pick on as choice
                if(choice === undefined || choice === ''){
                	choice = parseInt(Math.random()*3+1);
                }

                socket.emit('event', {'type': 'bet', 'playername': myname, 'choice': choice});

                countdown = 5;
                mychoice = undefined;
            }

            countdown--;
        }, 1000);    
    }
}

function stopCountdown(){
	clearInterval(countdowntimer);
}

function start(){
	var controlbutton = $('#control');
	startCapturing();
	startCountdown();

	controlbutton.text('STOP');
	controlbutton.attr('class', 'btn btn-warning');
}

function stop(){
	
	stopCapturing();
	stopCountdown();

	var controlbutton = $('#control');
	controlbutton.text('START');		
	controlbutton.attr('class', 'btn btn-primary');

	$('#countdown').text('');
	$('#player1 > #name').text('Player 1');
	$('#player2 > #name').text('Player 2');

	myname = undefined;
    anothername = undefined;
    mychoice = undefined;
    anotherchoice = undefined;
}

function checkPlayer1Name(){
	if(myname === undefined){
		var playername = prompt('Please enter your name','');

	    if (playername !== undefined && playername !== ''){
			var controlbutton = $('#control');
			controlbutton.text('Wait for another player');

			setMyname(playername);
			notifyAnotherPlayer(playername);	
	   }
	}
}

function setMyname(playername){
	myname = playername;
	$('#player1 > #name').text(playername);
}

function setAnothername(playername){
	anothername = playername;
	$('#player2 > #name').text(playername);	
}

function notifyAnotherPlayer(playername){
	if(playername !== undefined){
		socket.emit('event', {'type':'join', 'playername': playername});	
	}
}

function startCapturing(){
	controller = Leap.loop(function(frame) {
		
		var mychoice = getPlayerChoice(frame);

		var choiceDiv = $('#player1 > #choice');
		choiceDiv.text(stringifyChoice(mychoice));

		$('#player1 > #hands').empty();
		  	frame.hands.forEach(function(hand, index) {
			    var handobject = $('<div>hand id: ' + stringifyHand(hand) + '</div>');
			    $('#hands').append(handobject);
			    handobject.append('<div>Fingers</div>');
			    hand.fingers.forEach(function(finger, index){
			    	var fingerobject = $('<div>finger: ' + stringifyFinger(finger) + '</div>');
			    	handobject.append(fingerobject);
			    });
		  	});
		  
		}).use('screenPosition', {scale: 0.25});
}

function stopCapturing(){
	if(controller !== undefined){
		controller.disconnect();	
	}
}

function getPlayerChoice(frame){
	
	if(frame.hands.length <= 0){
		mychoice = '';
	}
	else{
		var fingerAmount = frame.hands[0].fingers.length;
		if(fingerAmount <= 1){
			mychoice = 1; //'ROCK';		
		}
		else if(fingerAmount == 2){
			mychoice = 2; //'SCISSORS';	
		}
		else{
			mychoice = 3; //'PAPER';	
		}
	}

	return mychoice;
}

function stringifyChoice(choice){
	switch(choice){
			case 1:
				return 'ROCK 石头';
				break;
			case 2:
				return 'SCISSORS 剪刀';
				break;
			case 3:
				return 'PAPER 布';
				break;
			default:
				break;
		}
}

function stringifyFinger(finger){
	return 'id:' + finger.id + '; direction:' + finger.direction + '; length:' + finger.length + '; stabilizedTipPosition:' + finger.stabilizedTipPosition;
}

function stringifyHand(hand){
	return 'id:' + hand.id + '; direction:' + hand.direction; 
}