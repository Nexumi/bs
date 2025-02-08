(function() {
	'use strict';

	const loading = document.getElementsByClassName('lds')[0];
	
	const timeouts = [];

	window.apiShort = function(url) {
		apiShort(url);
	}

	function apiShort(url) {
		function copyConfirmation() {
			const popup = document.getElementsByClassName('popuptext')[0];
			popup.classList.remove('removed');
			popup.classList.remove('hide');
			popup.classList.add('show');
			for (const timeout of timeouts) {
				clearTimeout(timeout);
			}
			timeouts.length = 0;
			timeouts.push(setTimeout(function() {
				popup.classList.remove('show');
				popup.classList.add('hide');
				timeouts.push(setTimeout(function() {
					popup.classList.add('removed');
					timeouts.length = 0;
				}, 1000));
			}, 3000));
		}

		// localhost
		if (window.location.protocol === "file:") {
			const urlSlice = url.slice(7)
			navigator.clipboard.writeText(`file://${window.location.pathname}${urlSlice === '?' ? '' : urlSlice}`);
			copyConfirmation();
			return;
		}

		// empty
		if (url == window.location.origin + '?') {
			navigator.clipboard.writeText(window.location.origin);
			copyConfirmation();
			return;
		}

		// offline mode
		if (!window.navigator.onLine) {
			navigator.clipboard.writeText(url);
			copyConfirmation();
			return;
		}

		const options = {
			method: 'POST',
			body: JSON.stringify({
				url: url
			})
		};

		// https://wolfgangrittner.dev/how-to-use-clipboard-api-in-firefox/
		if(typeof ClipboardItem && navigator.clipboard.write) {
			// NOTE: Safari locks down the clipboard API to only work when triggered
			//	 by a direct user interaction. You can't use it async in a promise.
			//	 But! You can wrap the promise in a ClipboardItem, and give that to
			//	 the clipboard API.
			//	 Found this on https://developer.apple.com/forums/thread/691873
			const text = new ClipboardItem({
			'text/plain': fetch('https://api.short.jpkit.us/', options)
				.then(response => {
					if (response.status === 409) {
						apiShort(url);
					} else if (response.status === 200) {
						return response.text();
					} else {
						navigator.clipboard.writeText(url);
						copyConfirmation();
					}
				})
				.then(data => new Blob([data], { type: 'text/plain' }))
			});
			navigator.clipboard.write([text]);
			copyConfirmation();
		}
		else {
			// NOTE: Firefox has support for ClipboardItem and navigator.clipboard.write,
			//	 but those are behind `dom.events.asyncClipboard.clipboardItem` preference.
			//	 Good news is that other than Safari, Firefox does not care about
			//	 Clipboard API being used async in a Promise.
			fetch('https://api.short.jpkit.us/', options)
				.then((response) => {
					if (response.status === 409) {
						apiShort(url);
					} else if (response.status === 200) {
						return response.text();
					} else {
						navigator.clipboard.writeText(url);
						copyConfirmation();
					}
				})
				.then((data) => {
					navigator.clipboard.writeText(data);
					copyConfirmation();
				});
		}
	}

	window.apiExpandShort = function(url) {
		if (!window.navigator.onLine) {
			apiExpandShort(url);
		}
	}

	function apiExpandShort(url) {
		const parts = url.split('/');
		fetch(`https://api.short.jpkit.us?domain=${parts[parts.length - 2]}&path=${parts[parts.length - 1]}`)
			.then((response) => {
				if (response.status === 200) {
					return response.text();
				}
			}).then((data) => {
				parseURL(data);
			});
	}

	const toBase64 = file => new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = () => resolve(reader.result);
		reader.onerror = reject;
	});

	window.apiReceipt = function() {
		if (window.navigator.onLine) {
			mindeeSubmit();
		}
	}

	function veryfiSubmit() {
		toBase64(document.getElementById('file').files[0])
			.then((base64) => {
				loading.classList.remove('hidden');

				// process receipt
				fetch('https://api.veryfi.jpkit.us/', {
					method: 'POST',
					body: JSON.stringify({
						'file_data': base64
					})
				})
					.then((response) => {
						return response.json();
					})
					.then((data) => {
						scannedReceipt({
							'products': data.line_items,
							'tax': data.tax,
							'tip': data.tip
						});

						// delete uploaded receipt
						fetch(`https://api.veryfi.jpkit.us/`, {
							method: 'DELETE',
							body: JSON.stringify({
								'document_id': data.id
							})
						})
							.then(() => {
								loading.classList.add('hidden');
							});
					})
					.catch((error) => {
						alert('Receipt scanning failed.\nProbably hit the API limit for the month.');
						loading.classList.add('hidden');
					});
			});
	}

	function mindeeSubmit() {
		toBase64(document.getElementById('file').files[0])
			.then((base64) => {
				loading.classList.remove('hidden');

				// process receipt
				fetch('https://api.mindee.jpkit.us/', {
					method: 'POST',
					body: JSON.stringify({
						'document': base64
					})
				})
					.then((response) => {
						return response.json();
					})
					.then((data) => {
						data = data.document.inference.prediction;
						scannedReceipt({
							'products': data.line_items.map(({description, total_amount}) => ({description, total: total_amount})),
							'tax': data.total_tax.value,
							'tip': data.tip.value
						});
						loading.classList.add('hidden');
					})
					.catch((error) => {
						veryfiSubmit();
					});
			});
	}
}());