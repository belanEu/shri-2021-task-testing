#!/bin/bash

lastTagVersion=$(git tag -l *-release | head -1)
tagInfo=$(git show "$lastTagVersion")
cutWord="commit"

echo "${tagInfo%%$cutWord*}"