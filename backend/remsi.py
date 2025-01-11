import sys, re, os

selectionsList = []
timeSelection = "between(t,0,"
filename = inputFile = end = start = None

# read standard input once, line by line
for line in sys.stdin:
	# detect a start of silence, which is an end of our selection
	end = re.search(r"silence_start: (\d+\.?\d+)", line)
	# detect an end of silence, which is a start of our selection
	start = re.search(r"silence_end: (\d+\.?\d+)", line)

	if filename is None:
		# find the input filename
		filename = re.search(r"Input .+ from '(.+)':", line)
	else:
		if inputFile is None:
			inputFile = filename.group(1)

	if start is not None:
		timeSelection = "between(t," + start.group(1) + ","
	if end is not None:
		timeSelection += end.group(1) + ")"
		selectionsList.append(timeSelection)

# Note: silencedetect apparently handles properly files that start and/or end in silence
# so we don't need to check for that and complete filters with no start or no end
selectionFilter = "'" + "+".join(selectionsList) + "'"

vfilter = "-vf \"select=" + selectionFilter + ",setpts=N/FRAME_RATE/TB\""
afilter = "-af \"aselect=" + selectionFilter + ",asetpts=N/SR/TB\""

inputFileName = os.path.join("videoStorage", os.path.split(inputFile)[1]) 
outputFileName = os.path.join("videoStorage", "cut", os.path.split(inputFile)[1]) 
# output ffmpeg command
# add using gpu for accleration
print("ffmpeg -y -i ", f"\"{inputFileName}\"", "-c:v h264_nvenc", vfilter, afilter, f"\"{outputFileName}\"" )