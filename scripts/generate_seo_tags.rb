#!/usr/bin/env ruby
require 'json'
require 'fileutils'
require 'nokogiri'
require 'set'
require 'yaml'
require 'cgi'

# Get the project root directory (one level up from scripts)
ROOT_DIR = File.expand_path('..', __dir__)

# Load site configuration for domain
config_path = File.join(ROOT_DIR, '_config.yml')
site_config = {}
if File.exist?(config_path)
  site_config = YAML.load_file(config_path)
end

# Site domain configuration
SITE_DOMAIN = ENV['SITE_DOMAIN'] || site_config['url']&.gsub(/^https?:\/\//, '') || 'comphy-lab.org'

# Load search database
search_db_path = File.join(ROOT_DIR, 'assets', 'js', 'search_db.json')
unless File.exist?(search_db_path)
  puts "Search database not found at #{search_db_path}"
  puts "Run scripts/generate_search_db.rb first"
  exit 1
end

search_db = JSON.parse(File.read(search_db_path))
puts "Loaded search database with #{search_db.length} entries"

# Initialize collections to store keywords and descriptions
keywords_by_url = {}
descriptions_by_url = {}
content_by_url = {}

# Track URL normalizations
normalized_urls = {}

##
# Normalizes a URL into a file path by removing fragments,
# ensuring a leading slash, appending "index.html" for directory URLs or URLs missing an extension,
# and then stripping the leading slash for file operations.
#
# @param url [String] the URL to be normalized.
# @return [String] the normalized relative file path.
#
# @example
#   normalize_url("about")         #=> "about/index.html"
#   normalize_url("/contact#team")   #=> "contact/index.html"
#   normalize_url("/index.html")   #=> "index.html"
def normalize_url(url)
  # Add debugging
  original_url = url.dup
  
  # Remove anchor
  url = url.split('#').first

  # Ensure URL starts with a slash
  url = "/#{url}" unless url.start_with?('/')

  # Add index.html to root URL
  url = "/index.html" if url == "/"

  # Add .html extension to URLs without extension
  unless url.include?('.')
    url = "#{url.chomp('/')}/index.html"
  end

  # Remove leading slash for file operations
  result = url.sub(/^\//, '')
  
  # Debug output
  puts "URL Normalization: #{original_url} -> #{result}" if ENV['DEBUG']
  
  result
end

# Process search database to generate metadata
search_db.each do |entry|
  url = entry['url'].to_s
  next if url.empty?

  # Convert URL with domain to relative URL
  if url.start_with?('http')
    # Skip truly external URLs (not on our domain)
    site_domain_pattern = Regexp.new("https?://#{Regexp.escape(SITE_DOMAIN)}")
    unless url.match?(site_domain_pattern)
      puts "Skipping external URL: #{url}" if ENV['DEBUG']
      next
    end
    
    # Remove domain part for our own domain
    url = url.sub(site_domain_pattern, '')
    puts "Converted URL to relative: #{url}" if ENV['DEBUG']
  end

  # Special handling for research paper URLs with anchors
  if url.include?('/research/#')
    # For URLs like /research/#16, use the research index page
    research_url = url.split('#').first
    normalized_url = normalize_url(research_url)
  else
    # Normalize URL for internal files
    normalized_url = normalize_url(url)
  end
  
  normalized_urls[url] = normalized_url

  # Initialize collections for this URL if not already present
  keywords_by_url[normalized_url] ||= Set.new
  descriptions_by_url[normalized_url] ||= Set.new
  content_by_url[normalized_url] ||= []

  # Extract keywords from title and content
  title = entry['title'].to_s
  content = entry['content'].to_s

  # Skip entries with little content
  next if content.length < 50

  # Generate keywords
  # From title - split and keep words longer than 3 characters
  title_keywords = title.downcase
                       .gsub(/[^\w\s]/, ' ')
                       .split(/\s+/)
                       .select { |w| w.length > 3 }
                       .map(&:strip)
                       .uniq
                       .take(5)
  
  # From type and tags
  type_keywords = [entry['type'].to_s.gsub('_', ' ')].reject(&:empty?)
  tag_keywords = (entry['tags'] || []).map(&:downcase)
  
  # Combine all keywords
  all_keywords = (title_keywords + type_keywords + tag_keywords).uniq.take(8)
  
  # Add to keywords for this URL
  keywords_by_url[normalized_url].merge(all_keywords)
  
  # Generate description
  description = content.gsub(/\s+/, ' ').strip.split(/[.!?]/).first
  
  # Only use if description is between 50 and 160 characters
  if description && description.length >= 50 && description.length <= 160
    descriptions_by_url[normalized_url].add(description)
  end
  
  # Store content for generating better descriptions if needed
  content_by_url[normalized_url] << content
end

puts "Generated metadata for #{keywords_by_url.keys.length} unique URLs"

# Generate better descriptions for URLs with no good descriptions
descriptions_by_url.each do |url, descriptions|
  if descriptions.empty? && content_by_url[url]
    # Join all content and create a description
    all_content = content_by_url[url].join(' ').gsub(/\s+/, ' ').strip
    
    # Take first 140 characters + ellipsis
    if all_content.length > 50
      description = all_content[0..140] + (all_content.length > 140 ? '...' : '')
      descriptions.add(description)
    end
  end
end

##
# Updates an HTML file with SEO metadata by modifying its keywords and description meta tags.
#
# This method reads the HTML file at the specified path and uses Nokogiri to parse and update—or add—meta tags for keywords and description based on the provided collections. It concatenates unique keywords and uses the first description when appropriate, updating the meta description only if it is missing or too short.
#
# @param file_path [String] Path to the HTML file to update.
# @param keywords [#to_a] A collection of keywords to include in the meta keywords tag.
# @param description [#to_a] A collection where the first element is used for the meta description tag.
#
# @return [Boolean, nil] Returns true if the update was successful, false if an error occurred, or nil if the file
#   does not exist or its HTML lacks a head element.
#
# @example
#   update_successful = update_html_with_metadata("public/index.html", Set.new(["ruby", "seo"]), Set.new(["Enhance page visibility with Ruby"]))
def update_html_with_metadata(file_path, keywords, description)
  return unless File.exist?(file_path)
  
  begin
    # Read file content
    html_content = File.read(file_path)
    
    # Parse with Nokogiri
    doc = Nokogiri::HTML(html_content)
    
    # Get existing head element
    head = doc.at_css('head')
    return unless head
    
    # Update meta tags
    update_keywords_meta(doc, head, keywords)
    update_description_meta(doc, head, description)
    
    # Write updated content back to file
    File.write(file_path, doc.to_html)
    return true
  rescue => e
    puts "Error updating metadata for #{file_path}: #{e.message}"
    return false
  end
end

# Update keywords meta tag
def update_keywords_meta(doc, head, keywords)
  return if keywords.empty?
  
  existing_keywords = doc.css('meta[name="keywords"]')
  keywords_str = keywords.to_a.uniq.join(', ')
  
  if existing_keywords.empty?
    # Add new meta tag for keywords
    head.add_child("<meta name=\"keywords\" content=\"#{CGI.escape_html(keywords_str)}\">")
  else
    # Update existing keywords
    existing_keywords.first['content'] = CGI.escape_html(keywords_str)
  end
end

# Update description meta tag
def update_description_meta(doc, head, description)
  return if description.empty?
  
  existing_description = doc.css('meta[name="description"]')
  desc_str = description.to_a.first
  
  # Add if no description meta or if the existing one is too short
  if existing_description.empty? || existing_description.first['content'].to_s.length < 50
    if existing_description.empty?
      # Add new meta tag for description
      head.add_child("<meta name=\"description\" content=\"#{CGI.escape_html(desc_str)}\">")
    else
      # Update existing description
      existing_description.first['content'] = CGI.escape_html(desc_str)
    end
  end
end

# Process HTML files and update metadata
site_dir = File.join(ROOT_DIR, '_site')
files_updated = 0

# Track updated files
updated_files = []

# Process each URL
keywords_by_url.each do |url, keywords|
  # Get description for this URL
  descriptions = descriptions_by_url[url] || Set.new
  
  # Get file path
  file_path = File.join(site_dir, url)
  
  # Update HTML file if it exists
  if update_html_with_metadata(file_path, keywords, descriptions)
    files_updated += 1
    updated_files << url
    puts "Updated metadata for #{url}" if ENV['DEBUG']
  end
end

# Print summary of files updated
if files_updated > 0
  puts "Updated #{files_updated} HTML files with SEO metadata"
  # List up to 10 files that were updated, to give a sense of what was changed
  if updated_files.length <= 10
    updated_files.each do |file|
      puts "  - #{file}"
    end
  else
    updated_files.take(5).each do |file|
      puts "  - #{file}"
    end
    puts "  - ... and #{updated_files.length - 5} more files"
  end
else
  puts "No HTML files were updated with SEO metadata"
end

##
# Generates a sitemap index XML file from an existing sitemap.
#
# This method checks for a sitemap.xml file in the specified directory. If found, it retrieves the file's last modified timestamp,
# creates a sitemapindex.xml file linking to the sitemap with the last modification date, writes the file to disk, and returns true.
# If sitemap.xml is not present, the method logs a message and returns false.
#
# @param site_dir [String] The directory containing the sitemap.xml file.
# @return [Boolean] True if sitemapindex.xml is generated successfully; false otherwise.
def generate_sitemapindex(site_dir)
  sitemap_path = File.join(site_dir, 'sitemap.xml')
  sitemapindex_path = File.join(site_dir, 'sitemapindex.xml')
  
  if File.exist?(sitemap_path)
    # Get last modification time
    last_mod = File.mtime(sitemap_path).strftime('%Y-%m-%dT%H:%M:%S%:z')
    
    # Create sitemapindex content
    sitemapindex_content = <<-XML
<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://#{SITE_DOMAIN}/sitemap.xml</loc>
    <lastmod>#{last_mod}</lastmod>
  </sitemap>
</sitemapindex>
    XML
    
    # Write to file
    File.write(sitemapindex_path, sitemapindex_content)
    puts "Generated sitemapindex.xml"
    return true
  else
    puts "sitemap.xml not found, skipping sitemapindex generation"
    return false
  end
end

# Generate sitemapindex
generate_sitemapindex(site_dir)

puts "SEO enhancement completed successfully!"
