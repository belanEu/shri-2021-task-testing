#!/bin/bash

currentTagVersion=$(git describe --abbrev=0 --match *-release)
previousTagVersion=$(git describe --abbrev=0 --tags "$(git rev-list --tags=*-release --skip=1 --max-count=1)" --match *-release)
echo "$previousTagVersion"
tagInfo=$(git show "$currentTagVersion")
cutWord="commit"

tagData=$(echo "${tagInfo%%$cutWord*}" | tr -s "\n" " ")
changelog=$(git log --pretty=format:"commit %h Author: %an Date: %ad Message: %s ||" "$previousTagVersion".."$currentTagVersion" | tr -s "\n" " ")
description="$tagData   CHANGELOG: $changelog"

curl -X POST \
    -H 'Content-Type: application/json' \
    -H 'Authorization: OAuth AQAAAAA7IE6_AAd46F8KihtUREqBrRXr7eV_5yU' \
    -H 'X-Org-Id: 6461097' \
    --data '{"queue":"TMP","summary":"Release tag '"$currentTagVersion"'","description":"'"$description"'"}' \
    https://api.tracker.yandex.net/v2/issues/
