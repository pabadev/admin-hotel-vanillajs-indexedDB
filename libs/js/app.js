
//global handler for the IDB
var db;

//current position for paging
var position = 0;

//total number of cats
var totalCats;

//dom items for prev/next buttons, not using jQuery but like the syntax
var $prev, $next;

//how many per page?
var page = 10;

document.addEventListener('DOMContentLoaded', init, false);

function init() {
	console.log('page init');

	$prev = document.querySelector("#backButton");
	$next = document.querySelector("#nextButton");

	$prev.addEventListener('click', move);
	$next.addEventListener('click', move);

	dbSetup().then(function() {
		console.log('db is setup');
		
		countData().then(function(result) {
			totalCats = result;
			displayData();
		});

	}).catch(function(e) {
		console.log('I had an issue making the db: '+e );	
	});
}

function dbSetup() {

	return new Promise(function(resolve, reject) {

		var req = window.indexedDB.open('page_test', 1);

		req.onupgradeneeded = function(e) {
			var thedb = e.target.result;
			var os = thedb.createObjectStore("cats", { autoIncrement:true});
			os.createIndex("name", "name", {unique:false});
			os.createIndex("age","age", {unique:false});
		};

		req.onsuccess = function(e) {
			db = e.target.result;
seedData();
			resolve();
		};

		req.onerror = function(e) {
			reject(e);
		};

	});

}

function countData() {

	return new Promise(function(resolve, reject) {
		
		db.transaction(['cats'],'readonly').objectStore('cats').count().onsuccess = function(e) {
			resolve(e.target.result);
		};

	});

}

function displayData() {
	
	getData(position,page).then(function(cats) {
		var s = '';
		cats.forEach(function(cat) {

			s += `
<tr>
	<td>${cat.name}</td>
	<td>${cat.breed}</td>
	<td>${cat.color}</td>
	<td>${cat.age}</td>
</tr>`;

		});

		document.querySelector('table#catTable tbody').innerHTML = s;
		console.log('got cats');

		/*
		so do we show/hide prev and next?
		*/
		if(position > 0) {
			console.log('enable back');
			$prev.removeAttribute('disabled');
		} else {
			$prev.setAttribute('disabled', 'disabled');
		}
		if(position + page < totalCats) {
			console.log('enable next');
			$next.removeAttribute('disabled');
		} else {
			$next.setAttribute('disabled', 'disabled');
		}

	});

}

function move(e) {
	if(e.target.id === 'nextButton') {
		position += page;
		displayData();
	} else {
		position -= page;
		displayData();
	}

}

function getData(start,total) {

	return new Promise(function(resolve, reject) {

		var t = db.transaction(['cats'],'readonly');
		var catos = t.objectStore('cats');
		var cats = [];

		console.log('start='+start+' total='+total);
		var hasSkipped = false;
		catos.openCursor().onsuccess = function(e) {

			var cursor = e.target.result;
			if(!hasSkipped && start > 0) {
				hasSkipped = true;
				cursor.advance(start);
				return;
			}
			if(cursor) {
				console.log('pushing ',cursor.value);
				cats.push(cursor.value);
				if(cats.length < total) {
					cursor.continue();
				} else {
					resolve(cats);
				}
			} else {
				console.log('resolving ',cats);
				resolve(cats);
			}
		};

	});

}

/*
there is no call to this, as it is a one time/test type thing.
*/
function seedData() {

	var getRandomInt = function(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	};
 
	var randomName = function() {
		var initialParts = ["Fluffy","Scruffy","King","Queen","Emperor","Lord","Hairy","Smelly","Most Exalted Knight","Crazy","Silly","Dumb","Brave","Sir","Fatty","Poopy","Scared","Old","Kid"];
		var lastParts = ["Sam","Smoe","Elvira","Jacob","Lynn","Fufflepants the III","Squarehead","Redshirt","Titan","Kitten Zombie","Dumpster Fire","Butterfly Wings","Unicorn Rider"];
		return initialParts[getRandomInt(0, initialParts.length-1)] + ' ' + lastParts[getRandomInt(0, lastParts.length-1)];
	};
 
	var randomColor = function() {
		var colors = ["Red","Blue","Green","Yellow","Rainbow","White","Black","Invisible","Plaid","Angry"];
		return colors[getRandomInt(0, colors.length-1)];
	};
 
	var randomGender = function() {
		var genders = ["Male","Female"];
		return genders[getRandomInt(0, genders.length-1)];
	};
 
   var randomAge = function() {
     return getRandomInt(1, 15);
   };
 
   function randomBreed() {
     var breeds = ["American Shorthair","Abyssinian","American Curl","American Wirehair","Bengal","Chartreux","Devon Rex","Maine Coon","Manx","Persian","Siamese"];
     return breeds[getRandomInt(0, breeds.length-1)];
   }
 
   //make 25 cats
   var cats = [];
   for(var i=0;i<25;i++) {
     var cat = {
       name:randomName(),
       color:randomColor(),
       gender:randomGender(),
       age:randomAge(),
       breed:randomBreed()
	   };
	   cats.push(cat);
   }

   var catStore = db.transaction(['cats'], 'readwrite').objectStore('cats');
   cats.forEach(function(cat) {
	   catStore.put(cat);
	   console.log('I just stored a cat.');
   });

}