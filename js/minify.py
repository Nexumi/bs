import requests

def minify(filename):
	with open(f'{filename}.js') as infile:
		response = requests.post('https://www.toptal.com/developers/javascript-minifier/api/raw', data=dict(input=infile.read())).text
		with open(f'{filename}.min.js', 'w', encoding="utf-8") as outfile:
			outfile.write(response)

minify('api');
minify('script')