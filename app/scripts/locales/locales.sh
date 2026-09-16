#!/bin/bash
#
# Lints the message catalogues in a folder:
#   1. every file is sorted by key (case-insensitively), and
#   2. every file has exactly the same set of key paths as its predecessor.
#
# (2) is the part that matters once a second language arrives: a key added to
# de.json and forgotten in en.json renders as the raw key id in production, and
# nothing else in the toolchain notices. (1) exists so that diffs on translation
# files stay readable instead of showing wherever the editor happened to append.
#
#   scripts/locales/locales.sh ./locales          check
#   scripts/locales/locales.sh ./locales --fix    rewrite in sorted order

if [ $# -eq 0 ]
then
  echo "You have to supply at least one argument specifying the folder to lint"
  exit 1
fi

FILES="$1"

tmp=$(mktemp)
exit_code=0

for locale_file in $FILES/*.json
do
  jq -f $(dirname "$0")/sort.jq $locale_file > "$tmp"
  # check sort order and fix it if required
  if [ "$2" == "--fix" ]
  then
    mv "$tmp" $locale_file
  else
    if diff -q "$tmp" $locale_file > /dev/null ;
    then
      : # all good
    else
      exit_code=$?
      echo "$(basename -- $locale_file) is not sorted by keys"
    fi
  fi
  # check keys
  if [ -n "$LAST_FILE" ]; then
    listPaths="jq -f $(dirname "$0")/keys.jq"
    diffString="<( cat $LAST_FILE | $listPaths ) <( cat $locale_file | $listPaths )"
    if eval "diff -q $diffString";
    then
      : # all good
    else
    eval "diff -y $diffString | grep '[|<>]'";
    printf "\n$LAST_FILE\" and $locale_file translation keys do not match, see diff above.\n"
    exit_code=1
    fi
  fi
  LAST_FILE=$locale_file
done

exit $exit_code
