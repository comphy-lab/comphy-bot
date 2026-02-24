#!/usr/bin/env bash

# Shared Ruby/Bundler bootstrap for local scripts.
# Determines required versions from Gemfile/Gemfile.lock, ensures a compatible
# Ruby is active, and ensures the lockfile Bundler version is installed.

BUNDLER_REQUIRED_VERSION=""

bundle_cmd() {
  if [ -n "${BUNDLER_REQUIRED_VERSION}" ]; then
    bundle "_${BUNDLER_REQUIRED_VERSION}_" "$@"
  else
    bundle "$@"
  fi
}

_version_ge() {
  # Returns success when $1 >= $2 (semantic-ish, via sort -V).
  [ "$(printf '%s\n%s\n' "$2" "$1" | sort -V | head -n1)" = "$2" ]
}

_extract_required_ruby_version() {
  local gemfile="$1"
  local lockfile="$2"
  local ruby_line
  local ruby_version

  if [ -f "$gemfile" ]; then
    ruby_line="$(grep -E '^[[:space:]]*ruby[[:space:]]+"[^"]+"' "$gemfile" | head -n1 || true)"
    if [ -n "$ruby_line" ]; then
      ruby_version="$(printf '%s\n' "$ruby_line" | grep -Eo '[0-9]+(\.[0-9]+){1,2}' | head -n1 || true)"
      if [ -n "$ruby_version" ]; then
        printf '%s\n' "$ruby_version"
        return 0
      fi
    fi
  fi

  if [ -f "$lockfile" ]; then
    ruby_version="$(awk '
      /^RUBY VERSION$/ {
        getline
        if (match($0, /[0-9]+\.[0-9]+\.[0-9]+/)) {
          print substr($0, RSTART, RLENGTH)
          exit
        }
      }
    ' "$lockfile")"
    if [ -n "$ruby_version" ]; then
      printf '%s\n' "$ruby_version"
      return 0
    fi
  fi
}

_extract_required_bundler_version() {
  local lockfile="$1"
  if [ ! -f "$lockfile" ]; then
    return 0
  fi

  awk '
    /^BUNDLED WITH$/ {
      getline
      gsub(/^[[:space:]]+/, "", $0)
      print
      exit
    }
  ' "$lockfile"
}

_activate_homebrew_ruby() {
  local ruby_prefix

  if ! command -v brew >/dev/null 2>&1; then
    echo "Homebrew not found. Install Homebrew or install Ruby manually." >&2
    return 1
  fi

  ruby_prefix="$(brew --prefix ruby 2>/dev/null || true)"
  if [ -z "$ruby_prefix" ] || [ ! -x "$ruby_prefix/bin/ruby" ]; then
    echo "Installing Ruby via Homebrew..."
    brew install ruby
    ruby_prefix="$(brew --prefix ruby)"
  fi

  export PATH="$ruby_prefix/bin:$PATH"
  hash -r
}

_install_ruby_if_missing() {
  if command -v ruby >/dev/null 2>&1; then
    return 0
  fi

  if [[ "${OSTYPE:-}" == "darwin"* ]]; then
    _activate_homebrew_ruby
    return $?
  fi

  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    if [[ "${NAME:-}" == *"Ubuntu"* ]] || [[ "${NAME:-}" == *"Debian"* ]]; then
      echo "Ruby is missing. Attempting install via apt..."
      DEBIAN_FRONTEND=noninteractive sudo apt-get update -y
      DEBIAN_FRONTEND=noninteractive sudo apt-get install -y --no-install-recommends \
        ruby-full build-essential zlib1g-dev
      return $?
    fi
  fi

  echo "Ruby is not installed and no automatic installer is configured for this OS." >&2
  return 1
}

_ensure_ruby() {
  local required_ruby="$1"
  local current_ruby

  _install_ruby_if_missing || return 1

  current_ruby="$(ruby -e 'print RUBY_VERSION' 2>/dev/null || true)"
  if [ -z "$current_ruby" ]; then
    echo "Ruby was not found in PATH after setup." >&2
    return 1
  fi

  if [ -n "$required_ruby" ] && ! _version_ge "$current_ruby" "$required_ruby"; then
    echo "Current Ruby $current_ruby is below required >= $required_ruby."
    if [[ "${OSTYPE:-}" == "darwin"* ]]; then
      _activate_homebrew_ruby || return 1
      current_ruby="$(ruby -e 'print RUBY_VERSION' 2>/dev/null || true)"
    fi
  fi

  if [ -n "$required_ruby" ] && ! _version_ge "$current_ruby" "$required_ruby"; then
    echo "ERROR: Ruby $current_ruby does not satisfy required >= $required_ruby." >&2
    return 1
  fi

  echo "Ruby version: $(ruby -v)"
}

_ensure_bundler() {
  local required_bundler="$1"
  local gem_user_bin

  gem_user_bin="$(ruby -e 'print Gem.user_dir' 2>/dev/null)/bin"
  if [ -n "$gem_user_bin" ] && [ -d "$gem_user_bin" ]; then
    export PATH="$gem_user_bin:$PATH"
  fi
  hash -r

  if [ -z "$required_bundler" ]; then
    if ! command -v bundle >/dev/null 2>&1; then
      echo "Bundler not found. Installing latest Bundler..."
      gem install bundler --user-install --no-document
      export PATH="$(ruby -e 'print Gem.user_dir')/bin:$PATH"
      hash -r
    fi
    BUNDLER_REQUIRED_VERSION=""
    echo "Bundler version: $(bundle --version)"
    return 0
  fi

  BUNDLER_REQUIRED_VERSION="$required_bundler"
  if ! bundle_cmd --version >/dev/null 2>&1; then
    echo "Installing Bundler $required_bundler..."
    gem install bundler -v "$required_bundler" --user-install --no-document
    export PATH="$(ruby -e 'print Gem.user_dir')/bin:$PATH"
    hash -r
  fi

  if ! bundle_cmd --version >/dev/null 2>&1; then
    echo "ERROR: Bundler $required_bundler is required but could not be activated." >&2
    return 1
  fi

  echo "Bundler version: $(bundle_cmd --version)"
}

setup_ruby_and_bundler() {
  local project_root="${1:-$(pwd)}"
  local gemfile="$project_root/Gemfile"
  local lockfile="$project_root/Gemfile.lock"
  local required_ruby
  local required_bundler

  required_ruby="$(_extract_required_ruby_version "$gemfile" "$lockfile")"
  required_bundler="$(_extract_required_bundler_version "$lockfile")"

  if [ -n "$required_ruby" ]; then
    echo "Required Ruby (minimum): $required_ruby"
  fi
  if [ -n "$required_bundler" ]; then
    echo "Required Bundler: $required_bundler"
  fi

  _ensure_ruby "$required_ruby"
  _ensure_bundler "$required_bundler"
}
