:: Batch file for Heroku to set config variables
SETLOCAL ENABLEDELAYEDEXPANSION

for /f "eol=/ tokens=1,2 delims=='" %%G in (.env_host) do (
	echo %%G %%H
	set value=%%H
	echo !value!
	if not "%value%"=="%value: =%" (
		echo "space exists"
	)
)