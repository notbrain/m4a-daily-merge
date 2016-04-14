/**
 * Resources Used: 
 * http://stackoverflow.com/questions/18434854/merge-m4a-files-in-terminal
 * https://nodejs.org/api/child_process.html#child_process_child_process_execfile_file_args_options_callback
 * http://codewinds.com/blog/2013-08-19-nodejs-writable-streams.html
 */

'use strict';
const moment   = require('moment');
const async    = require('async');
const execFile = require('child_process').execFile;
const fs       = require('fs');

const TODAY                      = moment().format('YYYY.MM.DD');

// TODO: OR PASS ARG OF DATE TO PARSE

const DIR_PREFIX                 = '/Volumes/Twelve/H100/';
const MERGED_AAC                 = DIR_PREFIX + 'H100.' + TODAY + '.Merged.aac';
const COMPLETE_M4A               = DIR_PREFIX + 'H100.' + TODAY + '.Complete.m4a';
const RESULT_MAX_FILE_SIZE_BYTES = 300000000;

let filePrefixes   = [];
let aacFiles       = [];

console.log("TODAY: " + TODAY);

for(let day_part = 1; day_part < 7; day_part++) {
  let prefix = DIR_PREFIX + 'H100.' + TODAY + '.0' + day_part;
  filePrefixes.push(prefix);
  aacFiles.push(prefix + '.aac');
}

async.each(filePrefixes, function(filePrefix, callback) {
  console.log('Processing file ' + filePrefix);

  //                             __
  //  _______  ___ _  _____ ____/ /_  ____ ___  ____
  // / __/ _ \/ _ \ |/ / -_) __/ __/ / _ `/ _ `/ __/
  // \__/\___/_//_/___/\__/_/  \__/  \_,_/\_,_/\__/
  //
  const ffmpegM4A_TO_AAC = [
    '-i', filePrefix + '.m4a',
    '-acodec', 
    'copy', 
    filePrefix + '.aac'
  ];

  execFile('/usr/local/bin/ffmpeg', ffmpegM4A_TO_AAC, (error, stdout, stderr) => {
    if (error) {
      throw error;
    }
    callback();
  });
  
}, function(err){
    if( err ) {
      console.log('A file failed to process: ', err);
    } else {
      console.log('All files have been converted to AAC.');

      //   __ _  ___ _______ ____
      //  /  ' \/ -_) __/ _ `/ -_)
      // /_/_/_/\__/_/  \_, /\__/
      //               /___/
      execFile('/bin/cat', aacFiles, {maxBuffer: RESULT_MAX_FILE_SIZE_BYTES, encoding: 'buffer'}, (error, stdout, stderr) => {
        if (error) {
          throw error;
        }

        // Cannot do file redirection using '>>' or '>' in exec of cat cmd, so write stdout
        let writeStream = fs.createWriteStream(MERGED_AAC);
        writeStream.write(stdout);
        writeStream.end();
        
        console.log('All files have been merged into a single AAC file.');

        //                             __          ____
        //  _______  ___ _  _____ ____/ /_  __ _  / / /___ _
        // / __/ _ \/ _ \ |/ / -_) __/ __/ /  ' \/_  _/ _ `/
        // \__/\___/_//_/___/\__/_/  \__/ /_/_/_/ /_/ \_,_/
        // 
        const ffmpegAAC_TO_M4A = [
          '-i', MERGED_AAC, 
          '-acodec', 
          'copy', 
          '-bsf:a', 
          'aac_adtstoasc', 
          COMPLETE_M4A
        ];

        execFile('/usr/local/bin/ffmpeg', ffmpegAAC_TO_M4A, (error, stdout, stderr) => {
          if (error) {
            throw error;
          }
          console.log('AAC file has been converted to M4A. ' + COMPLETE_M4A);
        });

      });
    }
});
