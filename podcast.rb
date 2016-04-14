#!/usr/bin/env ruby -wU
#
# by Kelan Champagne
# http://yeahrightkeller.com
#
# A script to generate a personal podcast feed, hosted on Dropbox
#
# Inspired by http://hints.macworld.com/article.php?story=20100421153627718
#
# Simply put this, and some .mp3 or .m4a files in a sub-dir under your Dropbox
# Public folder, update the config values below, and run the script.  To get
# the public_url_base value, you can right click on a file in that folder
# in Finder, then go to Dropbox > Copy Public Link, and then remove the
# filename.
#
# Notes:
#  * You'll need to re-run it after adding new files to the dir, or you can
#    set up Folder Actions as suggested by the above hint.
#  * This script uses `mdls` to get the title and summary of the podcast
#    from the Spotlight metadata, which requires it to be run on a Mac. But,
#    the rest of the script should be cross-platform compatible.

require 'date'

# Config values
podcast_title = "H100"
podcast_description = "Howard 100 on SiriusXM"
public_url_base = "http://hq.pdq.io/h100"


# Generated values
date_format = '%a, %d %b %Y %H:%M:%S %z'
podcast_pub_date = DateTime.now.strftime(date_format)

# Build the items
items_content = ""
Dir.entries('/Volumes/Twelve/H100/').each do |file|
    next if file =~ /^\./  # ignore invisible files
    next unless file =~ /\.(mp3|m4a)$/  # only use audio files

    puts "adding file: #{file}"

    item_size_in_bytes = File.size(file).to_s
    item_pub_date = File.mtime(file).strftime(date_format)
    item_title = `mdls --name kMDItemTitle #{file}`.sub(/^.*? = "/, '').sub(/"$/, '').chomp
    # item_subtitle = `mdls --name kMDItemComment #{file}`.sub(/^.*? = "/, '').sub(/"$/, '').chomp
    # item_summary = item_subtitle
    item_url = "#{public_url_base}/#{file}"
    item_content = <<-HTML
        <item>
            <title>#{item_title}</title>
            <enclosure url="#{item_url}" length="#{item_size_in_bytes}" type="audio/mpeg" />
            <pubDate>#{item_pub_date}</pubDate>
        </item>
HTML

    items_content << item_content
end

# Build the whole file
content = <<-HTML
<?xml version="1.0" encoding="ISO-8859-1"?>
<rss xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd" version="2.0">
    <channel>
        <title>#{podcast_title}</title>
        <description>#{podcast_description}</description>
        <pubDate>#{podcast_pub_date}</pubDate>
#{items_content}
    </channel>
</rss>
HTML

# write it out
output_file = File.new("/Volumes/Twelve/H100/podcast2.rss", 'w')
output_file.write(content)
output_file.close
