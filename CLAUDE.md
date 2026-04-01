# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A Chrome browser extension for quickly filling out job application forms with pre-prepared text snippets (materials).

## Project Goal

Users save their prepared resume/cover letter content as materials grouped by category, then quickly insert them into job application forms when applying to positions.

## Key Features

- Sidebar that slides out from the right when activating the extension
- Materials can be grouped (single-level grouping with expand/collapse)
- Click a material to auto-insert into the currently active textarea/input field
- Also supports drag-and-drop insertion into text fields
- Create new groups and new materials
- Edit/delete existing materials
- Automatic regex-based classification for special content (dates, phone numbers, emails)
- Toggle date format across all date materials between `YYYY-MM-DD` and `YYYY-MM`

## Commands

This is a new project. After setting up the project structure, common development commands will be added here.

## Architecture

Chrome extension with:
- Sidebar popup UI for managing and displaying materials
- Content script injected into web pages for handling text insertion
- Storage for persisting user materials (Chrome storage API)
- Drag-and-drop and click-to-insert interaction patterns
