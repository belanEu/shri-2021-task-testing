#!/bin/bash

lastTagVersion=$(git describe --abbrev=0 --match *-release)
tagInfo=$(git show "$lastTagVersion")
cutWord="commit"

tagData="${tagInfo%%$cutWord*}"

echo "$tagData"

curl -X POST \
    -H 'Content-Type: application/json' \
    -H 'Authorization: OAuth AQAAAAA7IE6_AAd46F8KihtUREqBrRXr7eV_5yU' \
    -H 'X-Org-Id: 6461097' \
    --data '{"queue":"TMP","summary":"Release tag '"$lastTagVersion"'"}' \
    https://api.tracker.yandex.net/v2/issues/
