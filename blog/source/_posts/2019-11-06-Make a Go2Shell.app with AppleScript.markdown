---
layout: post
title: "Make a Go2Shell.app with AppleScript"
date: 2019-11-06 03:04:27 +0800
comments: true
toc: true
header-img: "/img/header_img/safar-safarov-MSN8TFhJ0is-unsplash.jpg"
categories: "coding"
tag: ["tool"]
---

Really like [Go2Shell](https://apps.apple.com/app/id445770608), it allows you to open a terminal window to the current directory in Finder by a simple click. But unfortunately it is incompatible with MacOS 10.15. After a week of "open Terminal", "type 'cd '", "drag directory into Terminal" and "press Enter", I decide to build my own "Go2Shell".

## AppleScript

There may be many choices, Apple Script is the best for me. Simple and easy. What makes it easier is that before I figure out how to write AppleScript, I found the exact script I need from [Alfred](https://github.com/LeEnno/alfred-terminalfinder/blob/master/src/ft.scpt.txt). 

![script](script.png)

<!--more-->
	
- Export script as app use Script Editor. 

![app](app.png)

- Hold down the Command key and drag it to the toolbar.

- Click my Go2Shell, a terminal window pop up with current directory. Done!

## Custom App Icon

Right click the app, show contents. There is a file called applet.icns in Resources folder, replace it with what ever you want.

## [Repository Link](https://github.com/wonderyue/Go2ShellAppleScript)
