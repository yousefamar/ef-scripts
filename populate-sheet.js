const fs   = require('fs');
const util = require('util');
const edn  = require('jsedn');

let members   = edn.toJS(edn.parse(fs.readFileSync('members.edn', 'utf8')))[':cohort-members'];
let profiles  = edn.toJS(edn.parse(fs.readFileSync('profiles.edn', 'utf8')));
let questions = edn.toJS(edn.parse(fs.readFileSync('questions.edn', 'utf8')));

questions = questions[':questions'].reduce((acc, curr) => (acc[curr[':question-id']] = curr[':question-text']) && acc, {});

const cleanKey = str => str.replace(':', '').replace(/([-][a-z])/g, g => g.toUpperCase().replace('-', ''));
const clean = arr => {
	for (let obj of arr) {
		for (let k in obj) {
			if (typeof obj[k] === 'string')
				obj[k] = obj[k].trim();
			obj[cleanKey(k)] = obj[k];
			delete obj[k];
		}
	}
}

clean(members);
clean(Object.values(profiles));

// Remove duplicates (Sergio)
members = Object.values(members.reduce((acc, curr) => (acc[curr.entrepreneurId] = curr) && acc, {}));

console.log(Object.keys(profiles).length, 'profiles');
console.log(members.length, 'members');

for (let member of members) {
	let uuid = member.entrepreneurId;
	member.edge = member.metadata[':entrepreneur-classification']
		.replace(':technical-edge',   'Tech')
		.replace(':domain-edge',      'Domain')
		.replace(':smart-generalist', 'Catalyst');
	member.dashboardUrl = 'https://programme.joinef.com/#/cohort/3cd487e6-6348-4549-aa5f-1ace4d304cc3/member/' + uuid + '/profile';
	if (uuid in profiles) {
		member.profile = profiles[uuid];
		delete profiles[uuid]
	}
}

if (Object.keys(profiles).length > 0)
	console.warn('Warning: memberless profiles exist');

members = members.sort((a, b) => a.firstName < b.firstName ? -1 : a.firstName > b.firstName ? 1 : 0);

//console.log(members[1]);

let getUsersByFirstName = first => members.filter(m => m.firstName.toLowerCase() == first.toLowerCase());

let f = members
	.filter(m => m.profile == null)
	.map(m => [ m.firstName, m.lastName, m.active, m.roles ] );

//noprof = noprof.filter(m => m[':roles'].includes('user'));

//f.forEach(m => console.log(...m));

let rows = members.map(m => {
	let row = [
		m.profile && m.profile.profilePictureUrl ? `=IMAGE("${m.profile.profilePictureUrl}")` : '=IMAGE("https://programme.joinef.com/img/Badger_Grey.png")',
		m.firstName,
		m.lastName,
		m.edge,
		`=HYPERLINK("${m.dashboardUrl}","Dashboard")`,
		`=HYPERLINK("mailto:${m.email}","Email")`,
		m.profile && m.profile.linkedinUrl ? `=HYPERLINK("${m.profile.linkedinUrl}","LinkedIn")` : '',
		m.profile && m.profile.tags ? m.profile.tags.join('\n') : '',
		m.profile ? '' : 'Dropped out'
	];

	for (let question of Object.entries(questions)) {
		if (m.profile && m.profile.additionalInformation && question[0] in m.profile.additionalInformation)
			row.push(m.profile.additionalInformation[question[0]].replace(/\\n/g, '\n').replace(/\\t/g, '\t'));
		else
			row.push('');
	}
	return row;
});
let header = [
	'Photo',
	'Forename',
	'Surname',
	'Edge',
	'Dashboard',
	'Email',
	'LinkedIn',
	'Tags',
	'Status'
];
header.push(...Object.values(questions));
rows.unshift(header);

(async () => {
	const { google } = require('googleapis');
	let auth = await require('./sheets.js')();

	const sheets = google.sheets({ version: 'v4', auth });

	try {
		await sheets.spreadsheets.values.update({
			spreadsheetId: '13HsndcQVlygWVceoIIxQZ-Kt-6hYSaLqO3rXubI8G9s',
			range: 'Cohort!1:100',
			valueInputOption: 'USER_ENTERED',
			resource: {
				majorDimension: 'ROWS',
				values: rows
			}
		});
	} catch (e) {
		console.log('The API returned an error:', e);
		return;
	}
})();


/*
*/
