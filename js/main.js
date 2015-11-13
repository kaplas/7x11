var IN = 1,
	OUT = 2;

function log(str) {
	return function (val) {
		console.log(str, val);
	};
}

var circleEl = document.getElementById("circle"),
	circleContainerEl = document.getElementById("circle-container"),
	inTextEl = document.getElementById("in-text"),
	outTextEl = document.getElementById("out-text");

var textEls = {};
textEls[IN] = document.getElementById("in-text");
textEls[OUT] = document.getElementById("out-text");

var directionBus = new Bacon.Bus(),
	direction$ = directionBus.toProperty(IN),
	speedBus = new Bacon.Bus(),
	speed$ = speedBus.toProperty(1);

var tickDuration$ = Bacon.combineWith(function(direction, speed) {
	var factor = (direction === IN) ? 7 : 11;
	return factor * (1 / speed) * 10;
}, direction$, speed$);

var tick$ = tickDuration$.flatMapLatest(function(interval) {
	return Bacon.interval(interval);
});

function sum(a, b) { return a + b; }
var progressInteger$ = direction$
	.sampledBy(tick$)
	.map(function(direction) { return (direction === IN) ? 1 : -1; })
	.scan(0, sum);

var newDirection$ = progressInteger$.flatMap(function(progress) {
	switch (progress) {
		case 0: return IN;
		case 100: return OUT;
		default: return Bacon.never();
	}
});
directionBus.plug(newDirection$);

function opacity$for(wantedDirection) {
	return Bacon.combineWith(function(direction, progress) {
		if (direction !== wantedDirection) {
			return 0;
		} else {
			var invertedProgress = 100 - progress,
				effectiveProgress = Math.min(progress, invertedProgress);
			if (effectiveProgress <= 5) {
				return 0;
			} else if (effectiveProgress >= 20) {
				return 1;
			} else {
				return (effectiveProgress - 5) / 15;
			}
		}
	}, direction$, progressInteger$).skipDuplicates();
}

// ===========================================================

var circle = new ProgressBar.Circle('#circle', {
    color: '#EBCF55',
    strokeWidth: 2,

	from: { color: '#DDD5C8', width: 0.5 },
    to: { color: '#EBCF55', width: 2 },
    // Set default step function for all animate calls
    step: function(state, circle) {
        circle.path.setAttribute('stroke', state.color);
        circle.path.setAttribute('stroke-width', state.width);
    }
});

progressInteger$.onValue(function(progress) {
	circle.set(progress / 100);
});

newDirection$.onValue(function() {
	window.navigator.vibrate(100);
});

opacity$for(IN).onValue(function(opacity) {
	textEls[IN].style.opacity = opacity;
});

opacity$for(OUT).onValue(function(opacity) {
	textEls[OUT].style.opacity = opacity;
});

/*var speed = 0.4;
function duration() {
	var factor = (direction === "in") ? 7 : 11;
	return { duration: speed * factor * 1000 };
}

function vibrate() {
	window.navigator.vibrate(100);
}

function breatheIn() {
	direction = "in";
	circle.animate(1, duration(), function() {
		vibrate();
		breathOut();
	});
}

function breathOut() {
	direction = "out";
	circle.animate(0, duration(), function() {
		vibrate();
		breatheIn();
	});
}*/

/*var size = 50;
setInterval(function() {
	size += 50;
	//document.getElementById("circle").style.width = size + "px";
	circle.animate(0.7, function() {
	    circle.animate(0);
	});
}, 2000);*/

function resizeCircle() {
	var size = Math.min(window.innerWidth, window.innerHeight) * 0.7,
		marginTop = (window.innerHeight - size) / 2;
	circleEl.style.width = size + "px";
	circleContainerEl.style.top = marginTop + "px";
}
resizeCircle();
window.addEventListener('resize', resizeCircle);






/*progressInteger$.onValue(function(progress) {
	if (progress % 10 === 0) {
		console.log(progress);
	}
});*/


window.speedBus = speedBus;
window.directionBus = directionBus;

//breatheIn();