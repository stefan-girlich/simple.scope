#!/bin/python

# builds release-ready one-file bundles

from slimit import minify
from csscompressor import compress
import re
import urllib

# base path where app resources are stored
APP_BASEPATH = '../app/'

# output directory
OUT_BASEPATH = '../app/'

# output file name
OUT_FILENAME_MIN = 'simplescope.bundle.min.htm'


# returns a (text) file's contents
def getFileContents(filename):
	with open (APP_BASEPATH + filename, 'r') as srcFile:
		data = srcFile.read()
	return data

# builds the actual release file and stores it in its final location
# releaseMode: a string identifying the release mode; None is default
def buildReleaseBundle(releaseMode=None):
	# iterate over HTML by lines,
	# find JS and CSS refs and replace them with their resource file contents
	iter_html = iter(app_html_data.splitlines())
	app_html_new = '';
	for l in iter_html:

		matchCSS = re.match('\s*<link[^>]*href="([^"]*)"[^>]*[^>]*>.*', l)

		if matchCSS is None:
			# no CSS link match for line, check for JS

			matchJS = re.match('\s*<script[^>]*src="([^>]*)"[^>]*>[^<]*</script>\s*', l)

			if matchJS is None:
				# regular line, just append it
				app_html_new += l

			else:
				# line contains JS reference
				src = matchJS.group(1)
				fileContent = getFileContents(src)

				iter_js = iter(fileContent.splitlines())
				for k in iter_js:
					print '===>>> ' + k

				# only compress non-jQuery JS content
				if not src.startswith('jquery'):
					fileContent = minify(fileContent, mangle=True)

				app_html_new += '<script>'+fileContent+'</script>'

		else:	# line contains CSS sheet ref
			href = matchCSS.group(1)
			fileContent = getFileContents(href)

			iter_css = iter(fileContent.splitlines())
			fileContentBase64 = ''
			for j in iter_css:
				matchCssUrl = re.match('.*url\(\'([a-zA-Z0-9_]+\.png).*', j)

				if not matchCssUrl is None:
					cssUrl = matchCssUrl.group(1)
					startIx = j.index(cssUrl)
					endIx = startIx + len(cssUrl)

					base64 = 'data:image/png;base64,' + open(APP_BASEPATH + cssUrl, "rb").read().encode("base64").rstrip()
					
					fileContentBase64 += j[:startIx]+base64+j[endIx:]
				else:
					fileContentBase64 += j + '\n'

			app_html_new += '<style type="text/css">'+compress(fileContentBase64)+'</style>'

		# write output to file
		with open(OUT_BASEPATH + OUT_FILENAME_MIN, 'w') as destFile:
			destFile.write(app_html_new)

# // buildReleaseBundle


### DRIVER ###

# load index.htm file conents
with open(APP_BASEPATH + 'index.htm', 'r') as srcFile:
	app_html_data = srcFile.read()

buildReleaseBundle()







