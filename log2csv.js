const fs = require('fs');
const moment = require('moment');

const grouped = true;

let log = fs.readFileSync('./ld14-intercom-log.txt', 'utf8');

let timeRegex  = /^((\d?\d):(\d\d) ?(AM|PM)?)$/;
let dateRegex  = /^(Mon|Tue|Wed|Thur|Fri|Sat|Sun).*$/;
let joinRegex  = /^EFLD14 - (.*) and (.*) are now working on .*$/;
let leaveRegex = /^EFLD14 - (.*) is now available as a co-founder\.$/;

log = log.trim().split('\r\n');

let date;
let lastAMPM;
let firstLeft = false;

let people = {};

let onChange = () => {
	let soleByNum  = [];
	let teamsByNum = [];
	for (let p of Object.values(people)) {
		if (p.teamed)
			teamsByNum[p.teamCount - 1] = (teamsByNum[p.teamCount - 1] || 0) + 1;
		else
			soleByNum[p.teamCount] = (soleByNum[p.teamCount] || 0) + 1;
	}
	soleByNum[0] = 86 - (Object.values(people).length - (soleByNum[0] || 0));
	if (grouped) {
		let sole = soleByNum.reduce((acc, curr) => acc += (curr || 0), 0);
		console.log(`${+date},${sole},Sole Founders`);
		let teams = teamsByNum.reduce((acc, curr) => acc += (curr || 0), 0);
		console.log(`${+date},${teams},In a Team`);
	} else {
		for (let i = 0, len = Math.max(soleByNum.length, teamsByNum.length); i < len; ++i) {
			let j = i + 1;
			let sole  = soleByNum[i] || 0;
			console.log(`${+date},${sole},Sole Founders (${j}${j === 1 ? 'st' : j === 2 ? 'nd' : j === 3 ? 'rd' : 'th'} time)`);
			let teams = teamsByNum[i] || 0;
			console.log(`${+date},${teams},In a Team (${j}${j === 1 ? 'st' : j === 2 ? 'nd' : j === 3 ? 'rd' : 'th'} time)`);
		}
	}
};

console.log('Timestamp,Count,Group');

for (let line of log) {
	if (timeRegex.test(line)) {
		if (date == null)
			throw 'Got time before date';
		let match = line.match(timeRegex);
		lastAMPM = match[4] || lastAMPM;
		let hr = +match[2];
		if (lastAMPM === 'PM' && hr !== 12)
			hr += 12;
		else if (lastAMPM === 'AM' && hr === 12)
			hr = 0;
		date.hour(hr).minute(+match[3]);
		//console.log(date.format('LLLL'), '####', line, hr);
		continue;
	}
	if (dateRegex.test(line)) {
		date = moment(line, 'dddd, MMMM Do');
		continue;
	}
	if (line === 'Yesterday') {
		date = moment().subtract(1, 'day');
		continue;
	}
	let match = line.match(joinRegex);
	if (match != null) {
		let n1  = match[1];
		let n2  = match[2];
		let p1  = people[n1] = people[n1] || {};
		let p2  = people[n2] = people[n2] || {};
		p1.name = n1;
		p2.name = n2;
		p1.teamCount = (p1.teamCount || 0) + 1;
		p2.teamCount = (p2.teamCount || 0) + 1;
		p1.teamed = p2.teamed = true;
		onChange();
		continue;
	}
	match = line.match(leaveRegex);
	if (match != null && match[1] in people) {
		people[match[1]].teamed = false;
		if (firstLeft)
			onChange();
		firstLeft = !firstLeft;
		continue;
	}
	//console.log(line);
	//throw 'Unknown line format: ' + line
}
