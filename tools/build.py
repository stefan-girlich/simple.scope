#!/bin/python

# builds release-ready one-file bundles

from slimit import minify
from csscompressor import compress
import re
import urllib
import os
import zipfile

# TODO DYN
VERSION="0.3"

# base path where app resources are stored
APP_BASEPATH = '../app/'

# output directory
OUT_BASEPATH = '../build/'

# output file name
OUT_FILENAME_MIN = 'simplescope.'+VERSION+'.bundle.min.htm'
OUT_FILENAME_MIN_DEMO = 'simplescope.'+VERSION+'.demo.bundle.min.htm'


# returns a (text) file's contents
def getFileContents(filename):
	with open (APP_BASEPATH + filename, 'r') as srcFile:
		data = srcFile.read()
	return data

# builds the actual release file and stores it in its final location
# releaseMode: a string identifying the release mode; None is default
def buildReleaseBundle(out_filename, releaseMode=None):
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

				if not releaseMode is None:
					# non-default release mode

					# iterate through JS content by lines
					# find and apply in-code build instructions
					fileContentMod = ''
					iter_js = iter(fileContent.splitlines())
					for k in iter_js:
						# does the line contain a build marker?
						matchBuildMod = re.match('.*//.*#build:'+releaseMode+':([a-zA-Z0-9_]+)\s*.*', k)
						if not matchBuildMod is None:

							# ignore line
							def drop():
								pass

							actions = {
								'DROP':	drop
							}

							action = matchBuildMod.group(1)
							actions[action]()

						else:
							# append unmodified line
							fileContentMod += k + '\n'
				else:
					# default mode, ignore all in-code build instructions
					fileContentMod = fileContent

				# only compress non-jQuery JS content
				if not src.startswith('jquery'):
					fileContent = minify(fileContentMod, mangle=True)

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
		with open(OUT_BASEPATH + out_filename, 'w') as destFile:
			destFile.write(app_html_new)

# // buildReleaseBundle


### DRIVER ###

# load index.htm file conents
with open(APP_BASEPATH + 'index.htm', 'r') as srcFile:
	app_html_data = srcFile.read()

# build default and live demo versions
buildReleaseBundle(OUT_FILENAME_MIN)
buildReleaseBundle(OUT_FILENAME_MIN_DEMO, 'demo')

# store default build bundle in ZIP archive
zip_filename = OUT_FILENAME_MIN.split('.')
zip_filename.pop()
zip_filename = '.'.join(zip_filename) + '.zip'
zf = zipfile.ZipFile(OUT_BASEPATH + zip_filename, 'w')
zf.write(OUT_BASEPATH + OUT_FILENAME_MIN, OUT_FILENAME_MIN)
zf.close()




