#!/bin/bash

# CoMPhy Lab Website Setup Script
# Complete setup for both clean machines and existing development environments
# This script will install Ruby, Node.js, and all dependencies if not present
# Usage: ./scripts/setup.sh

set -e  # Exit on error

echo "🚀 Setting up CoMPhy Lab website environment..."
echo ""

# Check if running from project root
if [ ! -f "Gemfile" ]; then
  echo "❌ Error: Please run this script from the project root directory"
  echo "   Usage: ./scripts/setup.sh"
  exit 1
fi

# Check Ruby installation
echo "📦 Checking Ruby installation..."

# First check if Ruby is installed at all
if ! command -v ruby &> /dev/null; then
  echo "❌ Ruby not found. Installing Ruby via rbenv..."
  
  # Install rbenv
  if [ ! -d "$HOME/.rbenv" ]; then
    git clone https://github.com/rbenv/rbenv.git ~/.rbenv
    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
    echo 'eval "$(rbenv init -)"' >> ~/.bashrc
    
    # Also add to ~/.bash_profile for macOS compatibility
    echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bash_profile
    echo 'eval "$(rbenv init -)"' >> ~/.bash_profile
    
    # Install ruby-build plugin
    git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
  fi
  
  # Set PATH for current session
  export PATH="$HOME/.rbenv/bin:$PATH"
  eval "$(rbenv init -)"
  
  # Install Ruby 3.2
  echo "Installing Ruby 3.2.0..."
  rbenv install 3.2.0
  rbenv global 3.2.0
  
  echo "✅ Ruby installed successfully: $(ruby --version)"
  
# Check if rbenv is being used and handle version issues
elif command -v rbenv &> /dev/null && [ -f ".ruby-version" ]; then
  REQUIRED_VERSION=$(cat .ruby-version)
  echo "📌 Project requires Ruby $REQUIRED_VERSION (via .ruby-version)"
  
  # Check if the required version is installed
  if ! rbenv versions --bare | grep -q "^${REQUIRED_VERSION}$"; then
    echo "⚠️  Ruby $REQUIRED_VERSION is not installed via rbenv"
    echo "   Available versions:"
    rbenv versions
    echo ""
    
    # Try to use system Ruby or any available Ruby
    if command -v /usr/bin/ruby &> /dev/null; then
      echo "🔄 Using system Ruby instead..."
      export PATH="/usr/bin:$PATH"
    else
      # Remove .ruby-version temporarily to use any available Ruby
      echo "🔄 Temporarily bypassing .ruby-version to use available Ruby..."
      mv .ruby-version .ruby-version.bak
    fi
  fi
fi

# Now check Ruby again
if command -v ruby &> /dev/null; then
  RUBY_VERSION=$(ruby --version 2>&1 || echo "Ruby version check failed")
  if [[ "$RUBY_VERSION" == *"rbenv: version"* ]] && [ -f ".ruby-version.bak" ]; then
    # If rbenv still complains, we definitely need to bypass it
    rm -f .ruby-version
    RUBY_VERSION=$(ruby --version)
    mv .ruby-version.bak .ruby-version
  fi
  echo "✅ Ruby installed: $RUBY_VERSION"
else
  echo "❌ Ruby is not installed. Please install Ruby first."
  echo "   Visit: https://www.ruby-lang.org/en/documentation/installation/"
  exit 1
fi

# Check Bundler installation
echo "📦 Checking Bundler..."
if command -v bundle &> /dev/null; then
  BUNDLER_VERSION=$(bundle --version)
  echo "✅ Bundler installed: $BUNDLER_VERSION"
else
  echo "⚠️  Bundler not found. Installing..."
  gem install bundler
  echo "✅ Bundler installed"
fi

# Check Node.js installation
echo "📦 Checking Node.js..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  echo "✅ Node.js installed: $NODE_VERSION"
else
  echo "❌ Node.js not found. Installing Node.js via nvm..."
  
  # Install nvm
  if [ ! -d "$HOME/.nvm" ]; then
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
  fi
  
  # Source nvm for current session
  export NVM_DIR="$HOME/.nvm"
  [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
  [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
  
  # Install latest Node.js
  echo "Installing latest Node.js..."
  nvm install node
  nvm use node
  
  echo "✅ Node.js installed successfully: $(node --version)"
fi

# Check npm installation
echo "📦 Checking npm..."
if command -v npm &> /dev/null; then
  NPM_VERSION=$(npm --version)
  echo "✅ npm installed: $NPM_VERSION"
else
  echo "❌ npm is not installed. Please install npm."
  exit 1
fi

# Install Ruby dependencies
echo ""
echo "💎 Installing Ruby dependencies..."
bundle install

# Install Node.js dependencies
echo ""
echo "📦 Installing Node.js dependencies..."
# Skip prepare script (husky) during setup to avoid interactive prompts
npm install --no-fund --no-audit --ignore-scripts

# Manually create binary links for executables since we skipped scripts
echo "🔗 Setting up binary links..."
if [ -d "node_modules" ]; then
  mkdir -p node_modules/.bin
  # Link Jest
  if [ -f "node_modules/jest/bin/jest.js" ]; then
    ln -sf ../jest/bin/jest.js node_modules/.bin/jest 2>/dev/null || true
  fi
  # Link other common binaries that might be needed
  for bin in eslint prettier markdownlint stylelint; do
    if [ -f "node_modules/$bin/bin/$bin.js" ]; then
      ln -sf ../$bin/bin/$bin.js node_modules/.bin/$bin 2>/dev/null || true
    fi
  done
fi

# Check Jekyll installation
echo ""
echo "🏗️  Checking Jekyll..."
if bundle exec jekyll --version &> /dev/null; then
  JEKYLL_VERSION=$(bundle exec jekyll --version)
  echo "✅ Jekyll installed: $JEKYLL_VERSION"
else
  echo "❌ Jekyll installation failed"
  exit 1
fi

# Build the site and generate search database
echo ""
echo "🔨 Building site and generating search database..."
./scripts/build.sh

# Run simple validation tests
echo ""
echo "🧪 Running validation tests..."
node scripts/simple-test.js

# Restore .ruby-version if it was temporarily moved
if [ -f ".ruby-version.bak" ]; then
  echo ""
  echo "🔄 Restoring .ruby-version file..."
  mv .ruby-version.bak .ruby-version
fi

echo ""
echo "✨ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run the development server: bundle exec jekyll serve"
echo "   2. Open in browser: http://localhost:4000"
echo ""
echo "📚 Useful commands:"
echo "   - Build site: ./scripts/build.sh"
echo "   - Check code: ./scripts/lint-check.sh"
echo "   - Fix code issues: ./scripts/lint-check.sh --fix"
echo "   - Run tests: npm test (requires full npm install)"
echo "   - Update dependencies: bundle update && npm update"
echo ""