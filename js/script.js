(function() {
	'use strict';

	/*
	%20 →  
	%25 → %
	%27 → "
	%5B → [
	%5D → ]
	*/

	function person(name, price, item) {
		this.name = name;
		this.pritem = [[price, item]];
	}

	// input sections
	const rows = document.getElementsByClassName('row_wrapper')[0];
	const extra = document.getElementsByClassName('extra')[0];
	const result = document.getElementsByClassName('result')[0];

	// tax tip fee mode
	let tax_mode = '$';
	let tip_mode = '$';
	let fee_mode = '$';

	function getParams(url = window.location.search) {
		// BSv2→BSv6 parameter support
		// preset input sections from url parameters
		const urlParams = new URLSearchParams(url);
		const params = ['names', 'prices', 'items', 'extra'];
		for (let i = 0; i < params.length; i++) {
			const param = params[i];
			try {
				var get = eval(urlParams.get(param));
			} catch (tobe) {
				continue;
			}
			if (get !== null) {
				if (param === 'extra') {
					const inputs = extra.getElementsByTagName('input');
					if (get.length === 6) {
						// BSv6 support
						if (get[0] === '%') {
							fee_mode = '%';
							inputs[0].classList.add('hidden');
							inputs[2].classList.remove('hidden');
						}
						inputs[1].value = get[1];

						if (get[2] === '%') {
							tax_mode = '%';
							inputs[3].classList.add('hidden');
							inputs[5].classList.remove('hidden');
						}
						inputs[4].value = get[3];
						if (get[4] === '%') {
							tip_mode = '%';
							inputs[6].classList.add('hidden');
							inputs[8].classList.remove('hidden');
						}
						inputs[7].value = get[5];
					} else if (get.length === 4) {
						// BSv2 && BSv3 && BSv4 && BSv5 support
						if (get[0] === '%') {
							tax_mode = '%';
							inputs[3].classList.add('hidden');
							inputs[5].classList.remove('hidden');
						}
						inputs[4].value = get[1];
						if (get[2] === '%') {
							tip_mode = '%';
							inputs[6].classList.add('hidden');
							inputs[8].classList.remove('hidden');
						}
						inputs[7].value = get[3];
					} else {
						// BSv1 support
						tax_mode = '%';
						inputs[0].classList.add('hidden');
						inputs[2].classList.remove('hidden');
						inputs[1].value = get[0] || '';
						inputs[4].value = get[1] || '';
					}
				} else {
					const inputs = rows.children;
					for (let j = 0; j < get.length; j++) {
						inputs[j + 1].children[i].value = get[j];

						if (inputs[j + 2] === undefined) {
							createInput();
						}
					}
				}
			}
		}

		// BSv1 parameter support
		function invertExclude(exclude) {
			exclude = exclude.split(', ');
			exclude.push('');

			const row = rows.children;
			const include = [];

			for (let i = 1; i < row.length; i++) {
				const nameInput = row[i].children[0];

				if (!nameInput.value.includes(', ')) {
					if (!exclude.includes(nameInput.value)) {
						include.push(nameInput.value);
					}
				}
			}

			return include.join(', ');
		}

		const legacyParams = ['sitems', 'sprices', 'exclude'];
		const inputs = rows.children;
		const count = inputs.length;
		for (let i = 0; i < legacyParams.length; i++) {
			const param = legacyParams[i];
			try {
				var get = eval(urlParams.get(param));
			} catch (tobe) {
				continue;
			}
			if (get !== null) {
				if (param === 'sitems') {
					var getLength = get.length;
				}

				for (let j = 0; j < getLength; j++) {
					const input = inputs[count - 1 + j].children;
					switch (param) {
						case 'sitems':
							input[2].value = get[j];
							break;
						case 'sprices':
							input[1].value = get[j];
							break;
						case 'exclude':
							get[j] = invertExclude(get[j] || '');
							input[0].value = get[j];
							break;
					}

					if (inputs[count - 1 + j + 1] === undefined) {
						createInput();
					}
				}
			}
		}
	}

	window.scannedReceipt = function(props) {
		scannedReceipt(props);
	}

	function scannedReceipt(props) {
		const {products, tax, tip} = props;

		const row = rows.children;
		const taxInput = extra.getElementsByTagName('input')[4];
		const tipInput = extra.getElementsByTagName('input')[7];

		for (let item of products) {
			if (item.type !== undefined && [null, 'discount'].includes(item.type)) {
				continue;
			}

			const lastRow = row[row.length - 1];
			const priceInput = lastRow.children[1];
			const itemInput = lastRow.children[2];

			const {description, total} = item;
			priceInput.value = total;
			itemInput.value = description;
			createInput();
		}

		taxInput.value = tax;
		tipInput.value = tip;

		calculate();
	}

	function share() {
		// generate url link with parameters
		let link = [];
		const params = ['names', 'prices', 'items', 'extra'];
		for (let i = 0; i < params.length; i++) {
			// get inputs
			const param = params[i];

			let makeParam;
			if (param === 'extra') {
				// extra input handler
				const inputs = extra.getElementsByTagName('input');
				makeParam = []
				if (inputs[2].classList.contains('hidden')) {
					makeParam.push(encodeURIComponent('"$"'));
				} else {
					makeParam.push(encodeURIComponent('"%"'));
				}
				makeParam.push(encodeURIComponent('"' + inputs[1].value + '"'));
				if (inputs[5].classList.contains('hidden')) {
					makeParam.push(encodeURIComponent('"$"'));
				} else {
					makeParam.push(encodeURIComponent('"%"'));
				}
				makeParam.push(encodeURIComponent('"' + inputs[4].value + '"'));
				if (inputs[8].classList.contains('hidden')) {
					makeParam.push(encodeURIComponent('"$"'));
				} else {
					makeParam.push(encodeURIComponent('"%"'));
				}
				makeParam.push(encodeURIComponent('"' + inputs[7].value + '"'));
			} else {
				// add inputs to url parameters
				const inputs = rows.children;
				makeParam = [];
				for (var j = 1; j < inputs.length; j++) {
					makeParam.push(encodeURIComponent('"' + inputs[j].children[i].value + '"'));
				}
			}


			// trim
			if (param !== 'extra') {
				for (var j = makeParam.length - 1; j >= 0; j--) {
					if (makeParam[j] === '%22%22') {
						makeParam.pop();
					} else {
						break;
					}
				}
			}

			// checks
			if (!makeParam.length) {
				continue;
			}

			// add to url link
			if (param === 'extra' && ['%22%24%22', '%22%22', '%22%24%22', '%22%22', '%22%24%22', '%22%22'].every((val, index) => val === makeParam[index])) {
				continue;
			}
			link.push(param + '=%5B' + makeParam + '%5D');
		}

		// copy short link to clipboard
		apiShort(window.location.origin + '?' + link.join('&'));
	}

	function createInput() {
		// create new row
		let row = document.createElement('div');
		row.classList.add('row');

		// create input for Name row
		let field = document.createElement('input');
		field.setAttribute('type', 'text');
		row.appendChild(field);

		// create input for Price row
		field = document.createElement('input');
		field.setAttribute('type', 'text');
		row.appendChild(field);

		// create input for Item row
		field = document.createElement('input');
		field.setAttribute('type', 'text');
		row.appendChild(field);

		// push new row
		rows.appendChild(row);
	}

	function destroyInput(r = rows.children.length - 1) {
		// remove a row of inputs
		if (rows.children.length > 1) {
			rows.children[r].remove();
		}
	}

	function deleteHbr() {
		for (let i = 1; i <= 6; i++) {
			const h = result.getElementsByTagName('h' + i);
			const hlength = h.length;
			for (let j = 0; j < hlength; j++) {
				h[0].remove();
			}
		}

		const br = result.getElementsByTagName('br');
		const brlength = br.length;
		for (let i = 0; i < brlength; i++) {
			br[0].remove();
		}
	}

	function peopleFind(p, n) {
		for (let i = 0; i < p.length; i++) {
			if (p[i].name === n) {
				return i;
			}
		}

		return -1;
	}

	function itemFind(pt, i) {
		for (let j = 0; j < pt.length; j++) {
			if (pt[j][1] === i) {
				return j;
			}
		}

		return -1;
	}

	function peopleCreate() {
		const peep = [];

		// get inputs
		const row = rows.children;

		// get information from inputs
		for (let i = 0; i < row.length; i++) {
			try {
				// inputs
				const inputs = row[i].children;
				const nameInput = inputs[0];
				const priceInput = inputs[1];
				const itemInput = inputs[2];

				// get values
				const name = nameInput.value.replaceAll(',', ', ').replace(/\s+/g, ' ').trim();
				let price = priceInput.value.replace(/\s+/g, ' ').trim();
				const item = itemInput.value.replace(/\s+/g, ' ').trim();

				// update boxes
				if (nameInput !== document.activeElement) {
					nameInput.value = name;
				}
				if (priceInput !== document.activeElement) {
					priceInput.value = price;
				}
				if (itemInput !== document.activeElement) {
					itemInput.value = item;
				}

				price = eval(price);
				if (typeof price === 'number') {
					price = Number(price.toFixed(2));
				}

				// create/update object
				if (!isNaN(price)) {
					// update box v2
					if (priceInput !== document.activeElement) {
						priceInput.value = price.toFixed(2);
					}

					const splitNames = name.split(', ');
					for (let j = 0; j < splitNames.length; j++) {
						const find = peopleFind(peep, splitNames[j]);
						const label = item + (splitNames.length > 1 ? ' [Split]' : '');
						const finalPrice = price / splitNames.length;

						if (find !== -1) {
							// create/update price
							const pritem = peep[find].pritem;
							let pfit = itemFind(pritem, label);
							if (pfit !== -1) {
								pritem[pfit][0] += finalPrice;
							} else {
								pritem.push([finalPrice, label]);
							}
						} else {
							peep.push(new person(splitNames[j], finalPrice, label));
						}
					}
				}
			} catch (ignore) {
				// pass
			}
		}

		// destroy empty rows of inputs
		let i = 1;
		while (i < row.length - 1) {
			// inputs
			const inputs = row[i].children;
			const nameInput = inputs[0];
			const priceInput = inputs[1];
			const itemInput = inputs[2];

			if (!nameInput.value.length && nameInput !== document.activeElement &&
			 	!priceInput.value.length && priceInput !== document.activeElement &&
			 	!itemInput.value.length && itemInput !== document.activeElement) {
				destroyInput(i);
			} else {
				i++;
			}
		}

		// create row of inputs if no empty rows
		const lastRow = row[row.length - 1].children;
		for (const input of lastRow) {
			if (input.value.length) {
				createInput();
				break;
			}
		}

		return peep;
	}

	function costH(peep) {
		// get Extra inputs
		const ex = extra.getElementsByTagName('input');
		let fee, tax, tip;
		try {
			fee = eval(ex[1].value);
			if (typeof fee === 'number') {
				if (fee_mode === '$') {
					fee = fee.toFixed(2);
				}
				if (document.activeElement !== ex[1]) {
					ex[1].value = fee;
				}
			}
			if (fee_mode === '%') {
				fee /= 100;
			}
		} catch (what) {
			tip = NaN;
		}
		try {
			tax = eval(ex[4].value);
			if (typeof tax === 'number') {
				if (tax_mode === '$') {
					tax = tax.toFixed(2);
				}
				if (document.activeElement !== ex[4]) {
					ex[4].value = tax;
				}
			}
			if (tax_mode === '%') {
				tax /= 100;
			}
		} catch (what) {
			tax = NaN;
		}
		try {
			tip = eval(ex[7].value);
			if (typeof tip === 'number') {
				if (tip_mode === '$') {
					tip = tip.toFixed(2);
				}
				if (document.activeElement !== ex[7]) {
					ex[7].value = tip;
				}
			}
			if (tip_mode === '%') {
				tip /= 100;
			}
		} catch (what) {
			tip = NaN;
		}

		// get subtotal
		let subtotal = 0;

		for (let i = 0; i < peep.length; i++) {
			const pricy = peep[i].pritem;
			for (let j = 0; j < pricy.length; j++) {
				const price = pricy[j][0];
				if (!isNaN(price)) {
					subtotal += price;
				}
			}
		}

		// get fee, tax, and tip
		fee = Number(fee) || 0;
		if (fee_mode === '%') {
			fee *= subtotal;
		}
		tax = Number(tax) || 0;
		if (tax_mode === '%') {
			tax *= subtotal;
		}
		tip = Number(tip) || 0;
		if (tip_mode === '%') {
			tip *= subtotal;
		}

		// get total
		const total = subtotal + fee + tax + tip;

		// display Extras
		const h2 = extra.getElementsByTagName('h2');
		const h3 = extra.getElementsByTagName('h3');
		h2[0].innerText = 'Subtotal: $' + subtotal.toFixed(2);
		if (fee_mode === '$') {
			h3[1].innerText = 'Fee: ' + (Number((fee / subtotal * 100).toFixed(2)) || 0) + '%';
		} else {
			h3[1].innerText = 'Fee: $' + fee.toFixed(2);
		}
		if (tax_mode === '$') {
			h3[3].innerText = 'Tax: ' + (Number((tax / subtotal * 100).toFixed(2)) || 0) + '%';
		} else {
			h3[3].innerText = 'Tax: $' + tax.toFixed(2);
		}
		if (tip_mode === '$') {
			h3[5].innerText = 'Tip: ' + (Number((tip / subtotal * 100).toFixed(2)) || 0) + '%'
		} else {
			h3[5].innerText = 'Tip: $' + tip.toFixed(2);
		}
		h2[1].innerText = 'Total: $' + total.toFixed(2);
	}

	function individualH(peep) {
		// get Extra inputs
		const ex = extra.getElementsByTagName('input');
		const ext = extra.getElementsByTagName('h2');
		let fee, tax, tip;
		try {
			fee = eval(ex[1].value) || 0;
			if (fee_mode === '%') {
				fee /= 100
			}
		} catch (what) {
			fee = 0
		}
		try {
			tax = eval(ex[4].value) || 0;
			if (tax_mode === '%') {
				tax /= 100
			}
		} catch (what) {
			tax = 0
		}
		try {
			tip = eval(ex[7].value) || 0;
			if (tip_mode === '%') {
				tip /= 100;
			}
		} catch (what) {
			tip = 0;
		}

		if (fee_mode === '$') {
			fee /= ext[0].innerText.slice(11);
		}
		if (tax_mode === '$') {
			tax /= ext[0].innerText.slice(11);
		}
		if (tip_mode === '$') {
			tip /= ext[0].innerText.slice(11);
		}

		// calculate individual breakdowns
		for (let i = 0; i < peep.length; i++) {
			// skip no name
			if (!peep[i].name) {
				continue;
			}

			// cost per person
			let price = 0;
			const pricy = peep[i].pritem;
			for (let j = 0; j < pricy.length; j++) {
				const subprice = pricy[j][0];
				if (!isNaN(subprice)) {
					price += subprice;
				}
			}

			const personPrice = Number(price.toFixed(2))
			const personFee = Number((price * fee).toFixed(2))
			const personTax = Number((price * tax).toFixed(2))
			const personTip = Number((price * tip).toFixed(2))

			// true total
			const h3 = document.createElement('h3');
			h3.innerText = peep[i].name + ': $' + (personPrice + personFee + personTax + personTip).toFixed(2);
			result.appendChild(h3);

			// fee, tax, and tip
			let h5 = document.createElement('h5');
			h5.innerText = '\u2003\u2003Fee: $' + personFee.toFixed(2);
			result.appendChild(h5);

			h5 = document.createElement('h5');
			h5.innerText = '\u2003\u2003Tax: $' + personTax.toFixed(2);
			result.appendChild(h5);

			h5 = document.createElement('h5');
			h5.innerText = '\u2003\u2003Tip: $' + personTip.toFixed(2);
			result.appendChild(h5);

			// item breakdown
			for (let j = 0; j < pricy.length; j++) {
				const subitem = pricy[j];
				if (!isNaN(subitem[0]) && subitem[1].length) {
					h5 = document.createElement('h5');
					h5.innerText = '\u2003\u2003' + subitem[1] + ': $' + subitem[0].toFixed(2);
					result.appendChild(h5);
				}
			}
		}
	}

	function calculate() {
		const scrollTop = window.scrollY;

		deleteHbr();

		const people = peopleCreate();

		costH(people);
		individualH(people);

		window.scrollTo(0, scrollTop);
	}

	window.parseURL = function(url) {
		parseURL(url);
	}

	function parseURL(url) {
		if (url && ['names=', 'prices=', 'items=', 'extra=', 'sitems=', 'sprices=', 'exclude='].some((val, index) => url.includes(val))) {
			while (rows.children.length > 2) {
				destroyInput(1);
			}
			const loc = url.indexOf('?');
			getParams(url.slice(loc === -1 ? 0 : loc));
			calculate();
		}
	}

	function setOnlineOnlyEventListeners() {
		const onlineOnly = document.getElementsByClassName('online_only');

		for (const element of onlineOnly) {
			if (!window.navigator.onLine) {
				element.classList.add('hidden');
			}
		}

		window.addEventListener('online', () => {
			for (const element of onlineOnly) {
				element.classList.remove('hidden');
			}
		});
		window.addEventListener('offline', () => {
			for (const element of onlineOnly) {
				element.classList.add('hidden');
			}
		});
	}

	function setButtonEventListeners() {
		const file = document.getElementById('file');
		const customFile = document.getElementById('custom_file');
		const loadURL = document.getElementById('load_url');
		const feed = document.getElementById('fee_dollar');
		const feep = document.getElementById('fee_percent');
		const taxd = document.getElementById('tax_dollar');
		const taxp = document.getElementById('tax_percent');
		const tipd = document.getElementById('tip_dollar');
		const tipp = document.getElementById('tip_percent');

		customFile.addEventListener('click', function() {
			file.click();
		});
		loadURL.addEventListener('click', function() {
			const url = prompt("Enter URL");
			if (url) {
				if (url.includes('short.jpkit.us')) {
					apiExpandShort(url);
				} else {
					parseURL(url)
				}
			}
		});
		feed.addEventListener('click', function() {
			fee_mode = '%';
			feed.classList.add('hidden');
			feep.classList.remove('hidden');
			calculate();
		});
		feep.addEventListener('click', function() {
			fee_mode = '$';
			feep.classList.add('hidden');
			feed.classList.remove('hidden');
			calculate();
		});
		taxd.addEventListener('click', function() {
			tax_mode = '%';
			taxd.classList.add('hidden');
			taxp.classList.remove('hidden');
			calculate();
		});
		taxp.addEventListener('click', function() {
			tax_mode = '$';
			taxp.classList.add('hidden');
			taxd.classList.remove('hidden');
			calculate();
		});
		tipd.addEventListener('click', function() {
			tip_mode = '%';
			tipd.classList.add('hidden');
			tipp.classList.remove('hidden');
			calculate();
		});
		tipp.addEventListener('click', function() {
			tip_mode = '$';
			tipp.classList.add('hidden');
			tipd.classList.remove('hidden');
			calculate();
		});
	}

	function setEventListeners() {
		setOnlineOnlyEventListeners();
		document.getElementById('file').addEventListener('change', apiReceipt);
		document.getElementById('share').addEventListener('click', share);
		document.addEventListener('focusout', calculate);
		document.addEventListener('input', calculate);
		setButtonEventListeners();
	}

	createInput();
	getParams();
	setEventListeners();
	calculate();
}());