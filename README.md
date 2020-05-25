# GitHub Projects Story Points

> **:warning: WARNING:** This script is in a very early stage. Use it at your own risk.

Use Story Points in GitHub Project board without a hassle. No labels or issue title modifications needed.

![Preview](./assets/github-projects-story-points.png)

### Motivation

There are plenty of similar tools. However, all existing plugins or scripts I found base on Github labels or tags in task titles, which doesn't look professional. I prepared the script to keep the estimations internal, visible only on GitHub Project boards. The boards can set as private, which means this script allows to show Story Points only for authors or organization members.

### Features

The script has the following features:

- Show total Story Points number per column
- Show number of estimated cards and total cards number per column
- Highlight not estimated cards
- Highlight cards with invalid estimation
- Show total Story Points on the project board
- Ignore specific columns

Current implementation of the script recalculates Story Points every 2 seconds.

### Installation

1. Install [Violentmonkey](https://violentmonkey.github.io/) (open source) or [Tampermonkey](http://www.tampermonkey.net/) (closed source) plugin for your favorite web browser.
2. Navigate to the [GitHub Project Story Points User Script](https://raw.githubusercontent.com/pkosiec/github-projects-story-points/master/script.user.js) location. The script format is detected automatically and Tampermonkey will ask to install it.
3. The userscript manager will watch the script location and it will update the script automatically once new version is released.

### Usage

1. Navigate to your GitHub Project board.
1. Add a note to a column with a task description.
   > **NOTE**: To reference actual issue, paste a link into the note.
1. To define your Story Points value, include the following codeblock:
   ````
   ```est
   SP: {value}
   ```
   ````
   For example, for Story Points value of 3, the actual codeblock is:
   ````
   ```est
   SP: 3
   ```
   ````
1. Observe Story Point Column Summary update.

### Configuration

Currently the plugin doesn't expose official configuration options. As a workaround, you can modify the following lines of the script:

```javascript
const refreshInterval = 2000;
const highlightNotEstimatedCards = true;
const showTotalBoardStoryPoints = true;

// the column cards will be excluded from validation and counting Story Points:
// both from column and board Story Points count.
const excludedColumns = ["Inbox"];

// the column cards will be validated as usual and the column summary will be visible,
// but the Story Points from this column won't be counted towards the board total Story Points.
const excludedColumnsFromBoardStoryPointsCount = ["Backlog"];
```

However, keep in mind that every script update will overwrite your configuration values.

### Example

To see a live example, install the script and navigate to the [sample GitHub Project](https://github.com/pkosiec/gh-projects-story-points/projects/1).
