---
layout: post
title: "How to implement a zombie sniper gameplay based on UE"
date: 2023-02-15 21:09:21 -0800
comments: true
categories: "coding"
tags: ["UE"]
header-img: "/img/header_img/zombiesniper.png"
---
# Key Features

## sniper scope zoom in/out

Simply change FOV

## hitscan sniper

Do a LineTrace using the camera's direction

## headshot

Use the HitBoneName in the HitResult of LineTrace

## zombie like animation

Physical Animation. Simulate part of the body, like spine_02, the character will act like a zombie

## hit reaction

![enter image description here](hitreaction.gif)

Physical Animation. AddImpulse to the hit bone