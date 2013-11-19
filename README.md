# Nodestatus

## NOTICE:
This project was made for the Node Knockout 2013 competition. This repo will not be updated any further. We will post here the link to the new repo where the project will be continued.

## Quick Intro

Run vmstat, iostat, <any>stat remotely and chart it on your browser.

## Description

Runs <whatever>stat command - possibly remotely - and opens a browser with charts for the metrics (made with rickshaw/d3). Charts are updated realtime via socket.io.

Supports vm_stat and iostat on mac, vmstat on linux and other tools via simple json config file.

## Install

    git clone git@github.com:nko4/bazinga.git && cd ./bazinga/

    npm install

    node_modules/.bin/bower install

## Usage

Watch a local vmstat collecting samples every 1 s

    node server.js vmstat 1

Watch a local iostat collecting samples every 1 s

    node server.js iostat 1

Watch a remove vmstat collecting samples every 3 s

    node server.js --via "ssh deploy@bazinga.2013.nodeknockout.com" vmstat 3

Watch an unknown tool configured with a user specified config file, don't open a new browser

    node server.js --no-open --json config-samples/mac-vmstat.json vmstat 1

## Tools Used

Libraries: Restify Socket.IO angular.js Rickshaw / D3 Lodash Handlebars * optimist

angular, lodash and handlebars were only used to speed up development, probably not used at all for a final product.

CSS Toolkit: Ink (Includes Font Awesome)

## License

Code is licensed under the MIT License
