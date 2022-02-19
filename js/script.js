$(document).ready(start);

function node(identity) {
	//identity is the actual document id of node
	this.identity = identity,
	this.leftPos = 0,
	this.rightPos = 0,
	this.topPos = 0,
	this.bottPos = 0,
	this.health = 500,
	this.layerDeg = 0,
	this.nodeDeg = 0
}

//Object maker for le game obj.
function game() {
	this.node1 = new node('node1'),
	this.node2 = new node('node2'),
	this.node3 = new node('node3'),
	this.planet = {
		identity: 'planet',
		health: 2000,
		leftPos: document.getElementById('planet').getBoundingClientRect().left,
		rightPos: document.getElementById('planet').getBoundingClientRect().right,
		topPos: document.getElementById('planet').getBoundingClientRect().top,
		bottPos: document.getElementById('planet').getBoundingClientRect().bottom
	}
	this.nodeArr = [this.node1, this.node2, this.node3, this.planet],
	this.score = 0,
	this.curry = 0.00,
	this.currentLayer,
	this.currentNode,
	this.suggestedLayer2 = false,
	this.suggestedLayer3 = false,
	this.layer1IsThere = true,
	this.layer2IsThere = true,
	this.layer3IsThere = true	
}

var timers =  {
	metFreq: 2001,
	metFreqInterval: undefined,
	intervalId_NodePos: undefined,
	intervalId_Score: undefined,
	genMeteorTimeout: undefined
}

//rotationDeg and transition contain the browser-appropriate css property
//for transform and transition
var keydown = {
	leftRightIs: false, 
	medicIs: false, 
	dirChCode: -1,
}

var rotationDeg;
var transition;

var game;

function start() {
	rotationDeg = getSupportedProp(['transform', 'webkittransform', 'mstransform']);
	transition = getSupportedProp(['transition', 'webkittransition', 'otransition', 'moztransition']);
	game = new game();
	document.addEventListener('keydown', action);
	document.addEventListener('keyup', stopAction);
	game.currentLayer = document.getElementById('layer1');
	game.currentLayer.style.borderColor = 'orange';
	game.currentNode = game.node1;

	timers.intervalId_NodePos = setInterval(updateNodePos, 10);
	timers.intervalId_Score = setInterval(updateScore, 1000);
	timers.metFreqInterval = setInterval(decrementMetFreq, 2000);

	generateMeteor();
	// updateNodePos();
}

function updateScore() {
	var scoreEl = document.getElementById('score');
	// score = Math.round((score + 0.01)*100)/100;
	game.score+=1;
	scoreEl.innerHTML = game.score;
}

function getSupportedProp(propArr) {
	var n = document.getElementById('node1');
	for(var i=0; i<propArr.length; i++) {
		if(propArr[i] in n.style)
			return propArr[i];
	}
}

function action(event) {
	// var chCode = ('charCode' in event) ? event.charCode : event.keyCode;
	var chCode;
	if(event.keyCode) {
		chCode = event.keyCode;
	} else{
		chCode = event.charCode;
	}

	if(chCode == 65) {
		console.log('Need a medic?');
		keydown.medicIs = true;
	}

	if(chCode == 80) {
		pause();
		return;
	}

	//Detects if 1, 2, or 3 keys were pressed
	//Then assigns game.currentLayer to the document element of the active layer
	// as long as the medic key (a) is not pressed
	if(chCode == 49 || chCode == 50 || chCode == 51) {
		var layerNum = chCode - 48;
		if(!keydown.medicIs) {
			game.currentLayer.style.borderColor = 'white';
			game.currentLayer = document.getElementById('layer' + layerNum); 
			game.currentLayer.style.borderColor = 'orange';
			game.currentNode = game['node' + layerNum];
		} else {
			callTheMedic('node' + layerNum);
		}
	}

	//if the left or right arrow keys were pressed, move the node on the layer
	//left/right, etc. by calling actionAnimation
	if(!keydown.leftRightIs && (chCode == 39 || chCode == 37)) {
		console.log('action!');
		console.log(game.currentLayer.style['transform']);

		var node = document.getElementById(game.currentNode.identity);
		
		keydown.leftRightIs = true;
		keydown.dirChCode = chCode;
		actionAnimation(node);

	} else if(keydown.leftRightIs && (chCode == 39 || chCode == 37) && keydown.dirChCode != chCode) {
		keydown.dirChCode = chCode;
		//The argument that is passed in is an object because stopAction accepts
		// an event object with a keyCode property
		stopAction({keyCode:chCode});
		actionAnimation(node);
	}
}

function stopAction(event) {
	var code;
	if(event.keyCode) {
		code = event.keyCode;
	} else{
		code = event.charCode;
	}

	// The keydown.leftRightIs == code is for in case the user is holding two arrow keys down, 
	// and in the process of changing directions, lets up one key while the player is continually
	// pressing down the other key.
	if(code == 39 || code == 37) {
		$(game.currentLayer).stop();
		console.log('stop action!');
		// console.log(game.currentLayer.style['transform']);
		if(keydown.dirChCode == code)
			keydown.leftRightIs = false;
	} else if(code == 65) {
		keydown.medicIs = false;
	}
}

//Accepts the current node & rotates it based on 
//the user commands (which were recieved in the action method)
//This method will continually be called until the key is let up
function actionAnimation(node) {
	//The amount I want to rotate the layer/node
	var changeDegree 
	if(keydown.dirChCode == 39) {
	    // game.currentNode.nodeDeg-=20;
	    changeDegree = 4;
		game.currentNode.layerDeg+=0;
	}
	else if (keydown.dirChCode == 37) {
		// game.currentNode.nodeDeg+=20;
		changeDegree = -4;
		game.currentNode.layerDeg-=0;
	}

	//Because jquery does not have a built-in way to animate rotation, 
	//the below is done to rotate manually.
	//After the animation is done, actionAnimation is called again.
	$(game.currentLayer).animate({'rotateDeg': changeDegree}, {
		step: function(go) {
			// For some reason, if player changes direction, go will continue in the same direction
			// for a split second, and only then will it change direction. For this reason, 
			// the code goes that if go is the opposite sign of changeDegree, it is zero. 
			// Why is jquery so weird?
			go = (go < 0 && changeDegree > 0) || (go > 0 && changeDegree < 0) ? 0 : go;
			game.currentNode.layerDeg += go;
			game.currentLayer.style[rotationDeg] = 'rotate(' + game.currentNode.layerDeg + 'deg)';
		},
		// start: function() { 
		// 	// console.log("!!!!!");
		// 	// game.currentLayer.style[rotationDeg] = 'rotate(45px)';
		// },
		duration: 60,
		easing: 'linear',
		complete: function() {actionAnimation(node);}
	});
	// l.style[rotationDeg] = 'rotate(' + game.currentNode.layerDeg + 'deg)';
	// node.style[rotationDeg] = 'rotate(' + game.currentNode.nodeDeg + 'deg)';
}

function generateMeteor() {
	// Creating the meteor. 
	var meteor = document.createElement('div');
	var meteorSize = Math.floor(Math.random() * 61) + 30;
	meteor.style.height = meteorSize + 'px';
	meteor.style.width = meteorSize + 'px';
	meteor.style.borderRadius = meteorSize/2 + 'px';
	meteor.style.backgroundColor = 'orange';
	meteor.style.position = 'absolute';

	// dir contains a randomly selected side of the screen for the meteor to come in from.
	// The switch case stuff below merely sets where they appear, and randomizes where on
	// the randomly chosen side the meteor will come from.
	var dir = Math.floor(Math.random() * 4);
	switch(dir){
		case 0:
			meteor.style.left = '-' + meteorSize + 'px';
			meteor.style.top = Math.floor(Math.random() * 101) + '%';
			break;
		case 1:
			meteor.style.left = '100%';
			meteor.style.top = Math.floor(Math.random() * 101) + '%';
			break;
		case 2:
			meteor.style.top = '-' + meteorSize + 'px';
			meteor.style.left = Math.floor(Math.random() * 101) + '%';
			break;
		case 3:
			meteor.style.top = '100%';
			meteor.style.left = Math.floor(Math.random() * 101) + '%';
			break;
		default:
			alert('borked!!');
			break;
	}

	meteor = document.body.appendChild(meteor);

	var timeToArrival = Math.floor(Math.random()*5000)+2000;
	meteor.ETA = new Date().getTime() + timeToArrival;

	//js is such a joke! Haha check this out I've added a random property to an HTML div??!!
// 	alert(meteor.ETA);

	animateMeteor(meteor, meteorSize, timeToArrival);

	var interval = setInterval(checkHit.bind(meteor, interval), 10);

	console.log('meteor interval id: ' + interval);

	// Store the meteor's interval id as a class for canceling later on.
	meteor.className += 'meteor ' + interval;

	// Randomize the amount of time between each meteor being generated
	timers.genMeteorTimeout = setTimeout(generateMeteor, Math.floor(Math.random()*timers.metFreq)+timers.metFreq-501);
}	

function animateMeteor(meteor, meteorSize, timeToArrival) {
	// Make the meteor move towards the planet
	$(meteor).animate({
		left: '50%',
		marginLeft: ((-meteorSize)/2) + 'px',
		top: '50%',
		marginTop: ((-meteorSize)/2) + 'px'
	}, timeToArrival, function(){
		this.parentNode.removeChild(this);
		gameOver();
	});
}
// Decreases the amount of time between each meteor generation
// The shortest time allowed (the bar) is 1001 milliseconds. 
// Afterwards, there is no more increase in difficulty.
function decrementMetFreq() {
	if(timers.metFreq > 1001) {
		timers.metFreq-=50;
	} else {
		clearInterval(timers.metFreqInterval);
		timers.metFreqInterval = -1;
	}
}

function setOrbiting(layerId) {
	var nDeg;
	var deg;
	var layer = document.getElementById(layerId);

	switch(layerId) {
		case 'layer1':
			nDeg = game.node1.nodeDeg;
			deg = game.node1.layerDeg;
			break;
		case 'layer2':
			nDeg = game.node2.nodeDeg;
			deg = game.node2.layerDeg;
			break;
		case 'layer3':
			nDeg = game.node3.nodeDeg;
			deg = game.node3.layerDeg;
			break;
		default:
			alert('borrksedd!!');
			break;
	}

	$(layer).animate({'rotateDeg': deg + 360}, {
		step: function(go) {
			// layer.style[rotationDeg] = 'rotate(' + go + 'deg)';
			// deg = go;
		},
		duration: 6000,
		complete: function() {setOrbiting(layerId);}
	});
	
	// setTimeout(function() {
	// 	setOrbiting(layer);
	// 	console.log('setOrbit!!');
	// }, 6000);
}

function checkHit(metInterval) {
	var metPositions = this.getBoundingClientRect();
	var met_leftPos = Math.round(metPositions.left);
	var met_bottPos = Math.round(metPositions.bottom);
	var met_size = this.style.height;
	var met_topPos = Math.round(metPositions.top);
	var met_rightPos = Math.round(metPositions.right);
	//convert the string returned by elem.style.height into a number
	met_size = +met_size.substring(0, met_size.length-2);

	var nodeArr = game.nodeArr;

	for(var i = 0; i < nodeArr.length; i++) {
		// If the node currently being processed is not destroyed
		if(nodeArr[i] !== 0) {
			var halfSize = 10;

			// If the current node is the planet 
			if(i == nodeArr.length-1)
				halfSize = 40;

			// Distance formula to determine collision
			// The + halfSize is to get the centerpoint coordinate of the element by adding
			// half the size of the element to the x and y coordinates (rightPos and topPos, respectively)
			var distance = Math.sqrt(Math.pow((met_topPos+met_size/2)-(nodeArr[i].topPos+halfSize), 2) 
								   + Math.pow((met_rightPos-met_size/2)-(nodeArr[i].rightPos-halfSize), 2));

			if(distance <= 10 + met_size/2) {
				kaBoom(this, met_size, nodeArr[i].identity, metInterval);
				clearInterval(+this.className.split(' ')[1]);
				break;
			}
		}
	}
}

// Takes care of meteor die animations as well as damage to the stations from the mets
// Accepts the node;s document Id which intercepted meteor, the meteor itself, and 
// the size of the meteor in order to calculate damage
function kaBoom(met, met_size, node, metInterval) {
	clearInterval(metInterval);
	setTimeout(function() {
		$(met).stop();
	}, 50);

	// Sets the below unset variables to the appropriate values
	// according to whether the node is the planet or not
	var idNum, healthBar, maxHealth;
	if(node !== 'planet') {
		idNum = +node.substring(4);
		// Grabs all of the healthbars through classname
		var nodeHealthBars = document.getElementsByClassName('nodeHealth');
		// Then uses the node's id number to get the right healthbar from the nodelist
		healthBar = nodeHealthBars[idNum - 1];
		maxHealth = 500;
	} else {
		idNum = 4;
		healthBar = document.getElementById('planetHealth');
		maxHealth = 2000;
	}
	//minus 1 because 0 indexing
	var nodeObj = game.nodeArr[idNum - 1];

	// Gets percentage of health through simple arithmetic
	healthBar.style.width = (nodeObj.health / maxHealth) * 100 + '%';

	// The health of the node is deducted by the meteor's size in pixels 
	//divided by two and rounded to the nearest tens place
	nodeObj.health -= Math.round((met_size/2)/10)*10;
	if(nodeObj.health <= 0) {
		nodeObj.health = 0;
		if(node === 'planet') {
			gameOver();
			return;
		} else {
			nodeDestroyed(document.getElementById(node));
		}
	}

	console.log(nodeObj.identity + ' health: ' + nodeObj.health);


	// Animates the meteor after collision.
	$(met).animate({
		left: '100%',
		marginLeft: '-' + node.height,
		top: '30px'
	}, 200, function() {
		met.parentNode.removeChild(met);
		getPaidInCurry(met.style.height.substring(0, met.style.height.length-2));	
	});

	//below is a separate leave animation
	// $(node).fadeOut('quick', function() {
	// 	node.parentNode.removeChild(node);
	// });
}

function getPaidInCurry(size) {
	game.curry = Math.round((game.curry + size/3)*100)/100;

	var curryEl = document.getElementById('curry');
	curryEl.innerHTML = game.curry;

	if(game.curry >= 50)
		suggestLayer(2);
}

//Gives 50 health points to a layer
function callTheMedic(name) {
	//If the player has enough money (curry)
	if(game.curry >= 30) {
		game.curry -= 30;
		var curryEl = document.getElementById('curry');
		curryEl.innerHTML = game.curry;

		console.log('Medic called! +50 health points');
		var node = game[name];
		node.health += 50;
		//If the node's health is already at max
		if(node.health > 500)
			node.health = 500;

		var idNum = +node.identity.substring(4);
		var healthBar = document.getElementsByClassName('nodeHealth')[idNum - 1];
		healthBar.style.width = (node.health/500) * 100 + '%';
	}

}

function bringBackFromTheDead(node) {
	if(game.curry < 1000)
		return;

	game.curry -= 1000;

}

function nodeDestroyed(node) {
	console.log('nodeDestroyed');

	var layer = node.parentNode;
	$(layer).fadeOut('fast');

	//Sets the game value for the node's layerIsThere to false
	//Sets the value of the node from the game's node array to  zero, 
	//in effect, removing it from being checked for collision, etc.
	if(node.id == 'node1') {
		game.layer1IsThere = false;
		game.nodeArr[0] = 0;
	}
	else if(node.id == 'node2') {
		game.layer2IsThere = false;
		game.nodeArr[1] = 0;
	}
	else {
		game.layer3IsThere = false;
		game.nodeArr[2] = 0;
	}

	// If there are still nodes remaining, switch to the next one as the currentNode & currentLayer
	var switchToNode;
	//the length-1 is because the very last node in nodeArr is the planet itself
	for(var i = 0; i < game.nodeArr.length-1; i++) {
		if(game.nodeArr[i] !== 0)
			switchToNode = game.nodeArr[i];
	}

	if(switchToNode) {
		var idNum = switchToNode.identity.substring(4);
		game.currentNode = switchToNode;
		game.currentLayer = document.getElementById('layer' + idNum);
		game.currentLayer.style.borderColor = 'orange';
	} 
}

function gameOver() {
	$('.meteor').stop();
	clearInterval(timers.metFreqInterval);
	clearTimeout(timers.genMeteorTimeout);
}

function updateNodePos() {
	//length - 1 because the last element is the planet, and a planet is (mostly) stationary!
	for(var i = 0; i < game.nodeArr.length-1; i++) {
		// If the node currently being processed exists
		if(game.nodeArr[i] !== 0) {
			var node = document.getElementById(game.nodeArr[i].identity);
			var nodePositions = node.getBoundingClientRect();
			game.nodeArr[i].leftPos = Math.round(nodePositions.left);
			game.nodeArr[i].topPos = Math.round(nodePositions.top);
			game.nodeArr[i].rightPos = Math.round(nodePositions.right);
			game.nodeArr[i].bottPos = Math.round(nodePositions.bottom);
		}
	}
}

function suggestLayer(num) {
	var p = document.createElement('p');

	if(num === 2 && game.suggestedLayer2) {
		game.suggestedLayer2 = true;
		p.innerHTML = 'press ' + num + ' for an awesome upgrade :O';
	}

	p.style.fontSize = '10px';
	p.style.width = '100px';    
	p.style.position = 'absolute';
	p.style.left = '100%';
	p.style.marginLeft = '-100px';
	p.style.marginTop = '100px';
	p.style.color = 'cadetBlue';
	document.body.appendChild(p);
}

function pause() {
	alert('paused');
	var pauseTime = new Date();
	pauseTime = pauseTime.getTime();

	document.removeEventListener('keydown', action);
	document.removeEventListener('keyup', stopAction);		
	document.addEventListener('keydown', pausePressP.bind(null, pauseTime));

	$('.meteor').stop();
	$('.meteor').stop();

	clearInterval(timers.intervalId_NodePos);
	clearInterval(timers.intervalId_Score);
	if(timers.metFreqInterval !== -1)
		clearInterval(timers.metFreqInterval);

	clearTimeout(timers.genMeteorTimeout);

	var meteors = document.getElementsByClassName('meteor');

	// Removes the interval used for checking collision for each  meteor
	for(var i = 0; i < meteors.length; i++) {
		//The checkHit interval id for each meteor is it's second class
		// alert(meteors[i].className.split(' ')[1]);
		clearInterval(meteors[i].className.split(' ')[1]);
	}

	loadPauseScreen();

	function loadPauseScreen() {
		var blockScreen = document.getElementById('blockScreen');
		blockScreen.style.display = 'none';
	}
}

function pausePressP(pauseTime, event) {
	var chCode;
	if(event.keyCode) {
		chCode = event.keyCode;
	} else{
		chCode = event.charCode;
	}

	// If the P is pressed, unpause the game
	if(chCode == '80') {
		unpause(pauseTime);
	}
}

// An object containing all the timout and interval ids
// var timers =  {
// 	metFreq: 2001,
// 	metFreqInterval: undefined,
// 	intervalId_NodePos: undefined,
// 	intervalId_Score: undefined,
// 	genMeteorTimeout: undefined
// }

function unpause(pauseTime) {
	document.removeEventListener('keydown', pausePressP);
	document.addEventListener('keydown', action);
	document.addEventListener('keyup', stopAction);
	timers.intervalId_NodePos = setInterval(updateNodePos, 10);
	timers.intervalId_Score = setInterval(updateScore, 1000);
	//timers.genMeteorTimeout is set when generateMeteor is called 
	if(timers.metFreqInterval !== -1)
		timers.metFreqInterval = setInterval(decrementMetFreq, 2000);
	
	var meteors = document.getElementsByClassName('meteor');
	
	for(var i = 0; i < meteors.length; i++) {
		var meteor = meteors[i];
		console.log('meteor ETA: ' + 	meteor.ETA);
		var interval = setInterval(checkHit.bind(meteor, interval), 10);
		meteor.className = 'meteor ' + interval;
		animateMeteor(meteor, meteor.style.width, meteor.ETA - pauseTime);
	}

	generateMeteor();

	removePauseScreen();
	
	function removePauseScreen() {
		var blockScreen = document.getElementById('blockScreen');
		blockScreen.style.display = 'none';
	}
}




//TODO: (fix this): the pause function stops the meteors even after collision, even though they are "destroyed"
