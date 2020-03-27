let profiles = fs.readFileSync('profiles.edn', 'utf8');

profiles = profiles.split('uuid');
profiles.shift();
profiles = profiles.map(p => {
	let pic = 'https://programme.joinef.com/img/Badger_Grey.png';
	if (p.indexOf('profile-picture-url "') > -1) {
		pic = p.split('profile-picture-url "')[1];
		pic = pic.slice(0, pic.indexOf('"'));
	}
	let link = "javascript:alert('This person has no LinkedIn link')";
	if (p.indexOf('linkedin-url "') > -1) {
		link = p.split('linkedin-url "')[1];
		link = link.slice(0, link.indexOf('"'));
	}
	let tags = p.split('tags #{"')[1];
	tags = tags ? tags.slice(0, tags.indexOf('"}')).split('" "') : [];
	return { pic, link, tags };
});

fs.writeFileSync('profiles.json', JSON.stringify(profiles));
