#!/usr/bin/env bash

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LAYOUT_FILE="${REPO_ROOT}/_layouts/default.html"
DOC_FILE="${REPO_ROOT}/AGENTS.md"
ABOUT_SOURCE_FILE="${REPO_ROOT}/aboutVatsal.md"
ABOUT_FALLBACK_FILE="${REPO_ROOT}/about.md"

NAV_LINK='href="{{ site.baseurl }}/phd-thesis/"'
DOC_PHRASE="This page is included in the main navigation menu"
ABOUT_HEADING="# About Me"

if [[ ! -f "${LAYOUT_FILE}" ]]; then
  echo "Missing layout file: ${LAYOUT_FILE}"
  exit 1
fi

if [[ ! -f "${DOC_FILE}" ]]; then
  echo "Missing docs file: ${DOC_FILE}"
  exit 1
fi

if [[ ! -f "${ABOUT_SOURCE_FILE}" ]]; then
  echo "Missing source about content file: ${ABOUT_SOURCE_FILE}"
  exit 1
fi

if [[ ! -f "${ABOUT_FALLBACK_FILE}" ]]; then
  echo "Missing fallback about content file: ${ABOUT_FALLBACK_FILE}"
  exit 1
fi

nav_present=0
doc_phrase_present=0

if grep -Fq "${NAV_LINK}" "${LAYOUT_FILE}"; then
  nav_present=1
fi

if grep -Fq "${DOC_PHRASE}" "${DOC_FILE}"; then
  doc_phrase_present=1
fi

if [[ ${nav_present} -eq 1 && ${doc_phrase_present} -eq 0 ]]; then
  echo "PhD thesis nav link exists but docs are stale."
  echo "Update AGENTS.md to mention thesis page is in main navigation."
  exit 1
fi

if [[ ${nav_present} -eq 0 && ${doc_phrase_present} -eq 1 ]]; then
  echo "Docs mention thesis page in main navigation but nav link is missing."
  echo "Update AGENTS.md or restore nav link in _layouts/default.html."
  exit 1
fi

tmp_about_source="$(mktemp "${TMPDIR:-/tmp}/about_source.XXXXXX")"
tmp_about_fallback="$(mktemp "${TMPDIR:-/tmp}/about_fallback.XXXXXX")"
tmp_about_diff="$(mktemp "${TMPDIR:-/tmp}/about_diff.XXXXXX")"
trap 'rm -f "${tmp_about_source}" "${tmp_about_fallback}" "${tmp_about_diff}"' EXIT

cp "${ABOUT_SOURCE_FILE}" "${tmp_about_source}"
awk -v about_heading="${ABOUT_HEADING}" '
  $0 == about_heading {
    in_section = 1
  }
  in_section && $0 ~ /^# / && $0 != about_heading {
    exit
  }
  in_section {
    print
  }
' "${ABOUT_FALLBACK_FILE}" > "${tmp_about_fallback}"

if [[ ! -s "${tmp_about_fallback}" ]]; then
  echo "Could not find fallback heading '${ABOUT_HEADING}' in ${ABOUT_FALLBACK_FILE}."
  exit 1
fi

if ! diff -u "${tmp_about_source}" "${tmp_about_fallback}" > "${tmp_about_diff}"; then
  echo "About content drift detected between aboutVatsal.md and fallback content in about.md."
  echo "Update ${ABOUT_FALLBACK_FILE} fallback section to match ${ABOUT_SOURCE_FILE}."
  echo "Diff:"
  cat "${tmp_about_diff}"
  exit 1
fi

echo "PhD thesis nav/docs and about fallback sync checks passed."
